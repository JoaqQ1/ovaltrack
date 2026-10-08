import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EventCategoryGroup,
  EventVariant,
  HistoryItem,
  LiveCapturePersistedState,
  Possession,
} from '../types/live-capture.types';
import { LiveCaptureEventType, TemplateField } from '../types/event-type.types';
import { LocalMatchEvent } from '../types/event.types';
import { AvailablePlayer } from '../types/roster.types';
import { countsAsScoring, liveFields } from '../services/calculators/event-rules';
import { LiveCaptureService } from '../services/live-capture.service';
import { MatchService } from '../services/match.service';
import { StatisticCalculationService } from '../services/statistic-calculation.service';
import { PeriodStatisticDTO } from '../types/statistic.types';
import { CurrentStatsModalComponent } from './components/current-stats-modal/current-stats-modal.component';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

type CaptureTeam = 'OWN' | 'OPPONENT';

/** Un paso del modal: elegir jugador, o completar un campo `live` de la plantilla. */
interface CaptureStep {
  kind: 'player' | 'field';
  field?: TemplateField;
}

/**
 * Sesión del modal de captura. Los pasos se arman a partir del evento:
 * `[jugador si requiresPlayer] + [un paso por cada campo con phase = 'live']`.
 * Cada toque en una opción avanza; el último paso guarda el evento.
 */
interface CaptureSession {
  event: LiveCaptureEventType;
  eventId: string;
  steps: CaptureStep[];
  stepIndex: number;
  team: CaptureTeam;
  /** Solo con posesión NEUTRAL se puede elegir entre Propio y Rival. */
  canChooseTeam: boolean;
  /** Posesión vigente al abrir el modal; es la que se guarda en el evento. */
  possession: Possession;
  playerNumber: number | null;
  values: Record<string, unknown>;
}

/** Botón de jugador en la cuadrícula del modal. */
interface SlotView {
  number: number;
  name: string;
}

/**
 * La vista breve de un evento que se muestra en el historial de la pantalla.
 */
const POSSESSIONS: readonly Possession[] = ['OWN', 'NEUTRAL', 'OPPONENT'] as const;
/**
 * Pantalla de captura en vivo del partido.
 *
 * Permite al usuario registrar eventos (tries, penales, cambios de
 * posesión, etc.) a medida que ocurren durante el partido, asociando un
 * número de jugador a los eventos que lo requieran, y deshaciendo el
 * último evento o uno específico del historial.
 *
 * ### Flujo de captura (modal por pasos)
 * 1. {@link onEventTap} abre una {@link CaptureSession} con los pasos del evento
 *    (jugador y/o campos `live` de su plantilla). Si no tiene pasos, lo guarda directo.
 * 2. Cada toque en una opción avanza al paso siguiente; el último guarda con
 *    {@link commitWithFollowUp}. Si el tipo define un evento de seguimiento
 *    (p. ej. Try → Conversión), se abre otra sesión justo después.
 */
@Component({
  selector: 'ot-live-capture',
  standalone: true,
  imports: [CommonModule, CurrentStatsModalComponent, FormsModule],
  templateUrl: './carga-en-vivo.component.html',
  styleUrl: './carga-en-vivo.component.css'
})
export class CargaEnVivoComponent implements OnInit, OnDestroy {

  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly matchService = inject(MatchService);
  private readonly statisticCalculationService = inject(StatisticCalculationService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private matchId = '';

  /** Estados de posesión, en el orden en que se renderizan en la barra de posesión. */
  readonly possessions = POSSESSIONS;

  /** Jugadores titulares indexados por su puesto de alineación, del 1 al 15. */
  private readonly playersByStartingNumber = new Map<number, AvailablePlayer>();

  /** Los 15 titulares en cancha, agrupados para la cuadrícula del modal. */
  forwardSlots: SlotView[] = [];
  backSlots: SlotView[] = [];
  /** El rival solo se registra por número (1 a 23). */
  readonly rivalNumbers: number[] = Array.from({ length: 23 }, (_, index) => index + 1);

  readonly periods = ['inicio', '1er tiempo', '2do tiempo'];

  homeTeam = '';
  awayTeam = '';
  scoreboard = { home: 0, away: 0 };
  gameClock = '--:--';
  period = 1;
  periodLabel = '';
  isStarted = false;
  isStartingMatch = false;
  synchronized = false;
  clockPaused = false;
  historyVisible = false;

  isHalftime = false;
  showConfirmHalftime = false;
  showConfirmFinish = false;
  isFinished = false;
  showCurrentStatisticsModal = false;
  isCalculatingStats = false;
  isOfflineMode = false;
  currentStats: PeriodStatisticDTO | null = null;

  /** Sesión del modal de captura; `null` si no hay modal abierto. */
  capture: CaptureSession | null = null;

  private clockElapsedSeconds = 0;
  private clockStartedAt: number | null = null;
  private matchStartedAt: number | null = null;
  private clockTimer: ReturnType<typeof setInterval> | null = null;


  currentPossession: Possession = 'OWN';
  /** Catálogo completo (incluye tipos ocultos de la botonera). Se usa para lookups. */
  eventTypes: LiveCaptureEventType[] = [];
  /** Solo lo que se dibuja en la botonera (showInPalette). */
  categories: EventCategoryGroup[] = [];
  history: HistoryItem[] = [];
  errorMessage = '';
  isLoading = true;
  theme: 'light' | 'dark' = 'light';
  private events: LocalMatchEvent[] = [];

  /** Inicializa la pantalla, carga el partido y restaura su estado guardado. */
  ngOnInit(): void {
    // Cargar tema guardado o detectar preferencia del sistema
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.theme = savedTheme;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.theme = 'dark';
    }
    this.applyTheme(this.theme);

    const matchId = this.route?.snapshot.paramMap.get('matchId');
    if (!matchId) {
      this.errorMessage = 'No se indicó un partido válido.';
      this.isLoading = false;
      return;
    }
    const query = { matchId };
    this.matchId = matchId;

    this.liveCaptureService.getLiveCaptureBootstrap(query).subscribe({
      next: response => {
        const state = response.state;
        this.homeTeam = state.homeTeam;
        this.awayTeam = state.awayTeam;
        this.matchStartedAt = response.match.startedAt
          ? this.parseBackendTimestamp(response.match.startedAt)
          : null;
        this.scoreboard = { ...state.scoreboard };
        this.gameClock = state.gameClock;
        this.period = state.period ?? 1;
        this.isHalftime = state.isHalftime ?? false;
        this.isStarted = response.match.status !== 'not_started';
        this.periodLabel = this.isStarted
          ? (state.periodLabel || (this.isHalftime ? 'Entretiempo' : (this.period === 2 ? '2T' : '1T')))
          : 'Iniciar partido';
        this.synchronized = state.synchronized;
        // Durante el entretiempo el reloj debe estar detenido aunque el estado
        // recibido tenga clockPaused=false por una persistencia anterior.
        this.clockPaused = state.clockPaused || this.isHalftime;
        this.clockElapsedSeconds = this.parseClock(state.gameClock);
        if (!this.clockPaused && state.clockUpdatedAt) {
          const updatedAt = this.parseBackendTimestamp(state.clockUpdatedAt);
          if (Number.isFinite(updatedAt)) {
            const elapsedSinceUpdate = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
            this.clockElapsedSeconds += elapsedSinceUpdate;
            this.gameClock = this.formatClock(this.clockElapsedSeconds);
          }
        }
        this.currentPossession = state.currentPossession;
        this.eventTypes = response.eventTypes;
        this.categories = this.groupEventTypes(response.eventTypes.filter(e => e.showInPalette !== false));
        this.playersByStartingNumber.clear();
        response.rosterPlayers.forEach((player, index) => {
          this.playersByStartingNumber.set(index + 1, player);
        });
        this.buildSlots();
        this.events = response.recentEvents;
        this.rebuildStateFromEvents();
        this.liveCaptureService.syncPendingEvents(this.matchId).subscribe();

        if (!this.restorePersistedState(response.persistedState)) {
          if (!this.clockPaused && !this.isHalftime) {
            this.startClock();
          }
          this.persistState();
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readBackendError(error) ?? 'Ocurrió un error inesperado.';
        this.isLoading = false;
      },
    });
  }

  /** Detiene el temporizador cuando el componente deja de existir. */
  ngOnDestroy(): void {
    this.stopClock();
  }

  /** Etiqueta accesible para el botón de pausa/reanudar del reloj, según el estado actual. */
  get pausaLabel(): string {
    return this.clockPaused ? 'Reanudar reloj' : 'Pausar reloj';
  }

  /** Clase del ícono Tabler para el botón de pausa/reanudar del reloj, según el estado actual. */
  get pausaIcon(): string {
    return this.clockPaused ? 'ti ti-player-play' : 'ti ti-player-pause';
  }

  get periodLabelAction(): string {
    if (!this.isStarted) {
      return 'Empezar partido.';
    }
    return this.period === 1 ? 'Cerrar primer tiempo' : 'Finalizar partido';
  }

  toggleHistory(): void {
    this.historyVisible = !this.historyVisible;
  }

  /** Cambia el tema visual y lo conserva para futuras visitas. */
  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
    localStorage.setItem('theme', this.theme);
  }

  /** Aplica el tema seleccionado al elemento raíz del documento. */
  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Define qué equipo tiene la posesión actualmente.
  * Cambia la posesión manualmente; los eventos guardan la posesión que tenían
  * al momento de registrarse.
   */
  selectPossession(possession: Possession): void {
    if (!this.isStarted) {
      return;
    }

    this.currentPossession = possession;
    this.synchronized = false;
    this.persistState();
  }

  /** Maneja el toque sobre un chip de evento: abre el modal de captura (o guarda directo). */
  onEventTap(event: LiveCaptureEventType): void {
    if (!this.isStarted || this.capture) {
      return;
    }

    this.openCapture(event, this.createHistoryId(), this.currentPossession, null);
  }

  /** Crea y persiste un evento asociado al partido actual. */
  private commitEvent(
    event: any,
    eventId: string,
    player: AvailablePlayer | null,
    customAttributes?: any,
    onSuccess?: () => void,
    teamPossessionOverride?: string // 👈 1. NUEVO PARÁMETRO
  ): void {
    const timestamp = new Date().toISOString();

    let finalAttributes: any = customAttributes ? { ...customAttributes } : null;
    if (player !== null && finalAttributes?.playerNumber === undefined) {
      finalAttributes = finalAttributes || {};
      finalAttributes.playerNumber = player.jerseyNumber;
    }

    const localEvent: any = {
      id: eventId,
      eventTypeId: event.id,
      matchId: this.matchId,
      playerId: player?.id ?? null,
      teamPossession: teamPossessionOverride || this.currentPossession, // 👈 2. USAMOS EL EQUIPO FORZADO SI EXISTE
      matchTime: this.parseClock(this.gameClock),
      absoluteMatchTime: this.matchStartedAt === null
        ? null
        : Math.max(0, Math.floor((Date.now() - this.matchStartedAt) / 1000)),
      realTime: timestamp,
      period: this.period,
      origin: 'live-capture',
      attributes: finalAttributes,
      createdAt: timestamp,
      synchronizedAt: null,
      active: true,
      backendEventId: null,
      localSequence: this.nextEventSequence(),
    };

    this.liveCaptureService.saveEvent(localEvent).subscribe({
      next: savedEvent => {
        this.events = [...this.events, savedEvent];
        this.rebuildStateFromEvents();
        this.synchronized = savedEvent.synchronizedAt !== null;
        this.persistState();
        this.liveCaptureService
          .syncPendingEvents(this.matchId)
          .subscribe({
            next: () => onSuccess?.(),
          });
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readBackendError(error) ?? 'Ocurrió un error inesperado.';
      },
    });
  }

  /** Cancela una selección pendiente o elimina el último evento persistido. */
  undoLastEvent(): void {
    if (!this.isStarted) {
      return;
    }

    if (this.capture) {
      this.capture = null;
      return;
    }

    const lastEvent = this.latestEvent();
    if (lastEvent) {
      this.deleteEventAndRebuild(lastEvent);
    }
  }

  /** Elimina un evento específico y revierte sus efectos. */
  undoHistoryEvent(historyId: string): void {
    if (!this.isStarted) {
      return;
    }

    const event = this.events.find(currentEvent => currentEvent.id === historyId);
    if (event) {
      this.deleteEventAndRebuild(event);
    }
  }

  removeHistoryEvent(historyId: string): void {
    this.undoHistoryEvent(historyId);
  }

  /** Pausa o reanuda el reloj del partido sin afectar el historial de deshacer. */
  toggleClock(): void {
    if (!this.isStarted || this.isHalftime) {
      return;
    }

    if (!this.clockPaused) {
      this.updateClock();
      this.stopClock();
      this.clockElapsedSeconds = this.parseClock(this.gameClock);
    }

    this.clockPaused = !this.clockPaused;

    if (!this.clockPaused) {
      this.startClock();
    }

    this.synchronized = false;
    this.persistState();
  }

  /** Decide qué acción ejecutar al pulsar el botón de cambio de periodo. */
  onPeriodButtonClick(): void {
    if (!this.isStarted) {
      this.startMatch();
      return;
    }

    if (this.isFinished) {
      return;
    }

    if (this.period === 1 && !this.isHalftime) {
      this.showConfirmHalftime = true;
    } else if (this.period === 2 && !this.isHalftime) {
      this.showConfirmFinish = true;
    } else if (this.isHalftime) {
      this.router?.navigate(['/live-capture', this.matchId, 'halftime']);
    }
  }

  /** Inicia el partido en backend y habilita la captura de eventos. */
  startMatch(): void {
    if (this.isStartingMatch || this.isStarted) {
      return;
    }

    this.isStartingMatch = true;
    this.matchService.startMatch(this.matchId).subscribe({
      next: response => {
        this.isStarted = true;
        this.matchStartedAt = response.startedAt
          ? this.parseBackendTimestamp(response.startedAt)
          : this.matchStartedAt;
        this.periodLabel = '1T';
        this.clockPaused = false;
        this.isStartingMatch = false;
        this.startClock();
        this.synchronized = true;
        this.persistState();
      },
      error: () => {
        this.isStartingMatch = false;
        this.errorMessage = 'No se pudo iniciar el partido. Inténtalo nuevamente.';
      },
    });
  }

  /** Oculta el diálogo de confirmación del entretiempo. */
  cancelConfirmHalftime(): void {
    this.showConfirmHalftime = false;
  }

  /** Oculta el diálogo de confirmación de finalización. */
  cancelConfirmFinish(): void {
    this.showConfirmFinish = false;
  }

  /** Detiene el reloj y solicita al backend finalizar el partido. */
  confirmFinishMatch(): void {
    this.showConfirmFinish = false;
    this.stopClock();
    this.clockPaused = true;
    this.clockElapsedSeconds = this.parseClock(this.gameClock);
    this.periodLabel = 'Finalizado';
    this.persistState();

    this.matchService.finishMatch(this.matchId).subscribe({
      next: () => {
        this.isFinished = true;
        this.synchronized = true;
        this.isOfflineMode = false;
      },
      error: (error: HttpErrorResponse) => {
        this.synchronized = false;
        this.errorMessage = this.readBackendError(error) ?? 'Ocurrió un error inesperado.';
      },
    });
    this.router?.navigate(['/post-match/', this.matchId]);
  }

  /** Cierra el primer tiempo, guarda el estado y navega a sus estadísticas. */
  async confirmCloseFirstHalf(): Promise<void> {
    this.showConfirmHalftime = false;
    this.isHalftime = true;
    this.periodLabel = 'Entretiempo';

    // 1. Pausar el reloj inmediatamente
    this.stopClock();
    this.clockPaused = true;
    this.clockElapsedSeconds = this.parseClock(this.gameClock);

    // 2. Persistir localmente
    this.persistState();

    // 3. Sincronizar en segundo plano con el backend
    this.matchService.closeFirstHalf(this.matchId).subscribe({
      next: () => {
        this.synchronized = true;
        this.isOfflineMode = false;
      },
      error: () => {
        // En offline la experiencia continúa sin interrupciones
        this.synchronized = false;
        this.isOfflineMode = true;
      },
    });

    // 4. Redirigir a la pantalla dedicada de estadísticas de entretiempo
    this.router?.navigate(['/live-capture', this.matchId, 'halftime']);
  }

  async openCurrentStatisticsModal(): Promise<void> {
    this.showCurrentStatisticsModal = true;
    this.isCalculatingStats = true;

    try {
      await firstValueFrom(this.liveCaptureService.syncPendingEvents(this.matchId));
      this.events = await firstValueFrom(this.liveCaptureService.getLocalEvents(this.matchId));
      const allEventTypes = this.eventTypes;
      this.currentStats = await this.statisticCalculationService.calculateMatchStatistics(
        this.matchId,
        this.events,
        allEventTypes
      );
    } catch (error) {
      console.error('Error al calcular estadísticas tácticas:', error);
    } finally {
      this.isCalculatingStats = false;
    }
  }

  closeCurrentStatisticsModal(): void {
    this.showCurrentStatisticsModal = false;
  }

  /** Inicia un intervalo que actualiza el reloj periódicamente. */
  private startClock(): void {
    this.stopClock();
    this.clockStartedAt = Date.now();
    this.clockTimer = setInterval(() => this.updateClock(), 250);
  }

  /** Cancela el intervalo del reloj y limpia su instante de inicio. */
  private stopClock(): void {
    if (this.clockTimer !== null) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
    this.clockStartedAt = null;
  }

  /** Calcula el tiempo transcurrido y actualiza el texto del reloj. */
  private updateClock(): void {
    if (this.clockPaused || this.clockStartedAt === null) {
      return;
    }

    const elapsedSinceStart = Math.floor((Date.now() - this.clockStartedAt) / 1000);
    const nextClock = this.formatClock(this.clockElapsedSeconds + elapsedSinceStart);

    if (nextClock !== this.gameClock) {
      this.gameClock = nextClock;
      // this.persistState(false);
    }
  }

  /** Construye y guarda una copia del estado actual de la pantalla. */
  private persistState(updateClock = true): void {
    if (updateClock && !this.clockPaused) {
      this.updateClock();
    }

    const state: LiveCapturePersistedState = {
      matchId: this.matchId,
      isStarted: this.isStarted,
      gameClock: this.gameClock,
      periodLabel: this.periodLabel,
      period: this.period,
      isHalftime: this.isHalftime,
      synchronized: this.synchronized,
      clockPaused: this.clockPaused,
      pendingSelection: null,
      clockElapsedSeconds: this.parseClock(this.gameClock),
      savedAt: Date.now(),
      currentPossession: this.currentPossession,
      scoreboard: { ...this.scoreboard },
    };

    this.liveCaptureService.saveLiveCaptureState(state).subscribe({
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readBackendError(error) ?? 'Ocurrió un error inesperado.';
      },
    });
  }

  /** Restaura el estado persistido y reanuda el reloj si correspondía. */
  private restorePersistedState(state: LiveCapturePersistedState | undefined): boolean {
    if (!state || state.matchId !== this.matchId || !this.isValidPersistedState(state)) {
      return false;
    }

    this.period = state.period;
    this.periodLabel = this.isStarted ? state.periodLabel : 'Iniciar partido';
    this.isHalftime = state.isHalftime ?? (state.periodLabel === 'Entretiempo');
    this.synchronized = state.synchronized;
    // El entretiempo siempre tiene prioridad sobre un valor antiguo del reloj.
    this.clockPaused = state.clockPaused || this.isHalftime;
    this.clockElapsedSeconds = state.clockElapsedSeconds;
    if (state.currentPossession) {
      this.currentPossession = state.currentPossession;
    }
    if (state.scoreboard) {
      this.scoreboard = { ...state.scoreboard };
    }

    if (!this.isStarted || this.clockPaused) {
      this.clockPaused = true;
      this.gameClock = this.formatClock(this.clockElapsedSeconds);
      this.stopClock();
    } else {
      const elapsedSinceSave = Math.max(0, Math.floor((Date.now() - state.savedAt) / 1000));
      this.clockElapsedSeconds += elapsedSinceSave;
      this.gameClock = this.formatClock(this.clockElapsedSeconds);
      this.startClock();
    }

    return true;
  }

  /** Verifica que los datos recuperados tengan el formato esperado. */
  private isValidPersistedState(state: LiveCapturePersistedState): boolean {
    return Number.isInteger(state.period)
      && state.period > 0
      && Number.isFinite(state.clockElapsedSeconds)
      && Number.isFinite(state.savedAt)
      && typeof state.isStarted === 'boolean'
      && typeof state.gameClock === 'string'
      && typeof state.periodLabel === 'string'
      && typeof state.clockPaused === 'boolean'
      && typeof state.synchronized === 'boolean';
  }

  /** Convierte un reloj con formato mm:ss a una cantidad de segundos. */
  private parseClock(clock: string | undefined): number {
    if (!clock) {
      return 0;
    }

    const [minutes, seconds] = clock.split(':').map(Number);
    return Number.isFinite(minutes) && Number.isFinite(seconds)
      ? Math.max(0, minutes * 60 + seconds)
      : 0;
  }

  /** Convierte una cantidad de segundos al formato mm:ss. */
  private formatClock(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /** Interpreta como UTC los LocalDateTime del backend que no incluyen zona horaria. */
  private parseBackendTimestamp(timestamp: string): number {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(timestamp);
    return Date.parse(hasTimezone ? timestamp : `${timestamp}Z`);
  }

  /** Devuelve el último evento de la lista, si existe. */
  private latestEvent(): LocalMatchEvent | undefined {
    return this.events[this.events.length - 1];
  }

  /** Genera el siguiente número de secuencia para un evento local. */
  private nextEventSequence(): number {
    return this.events.reduce((highest, event) => Math.max(highest, event.localSequence), 0) + 1;
  }

  /** Genera un identificador único para una entrada del historial. */
  private createHistoryId(): string {
    return crypto.randomUUID();
  }

  /** Elimina un evento y vuelve a calcular el estado derivado del partido. */
  private deleteEventAndRebuild(event: LocalMatchEvent): void {
    const deletingLatestEvent = this.latestEvent()?.id === event.id;
    this.liveCaptureService.deleteEvent(event).subscribe({
      next: () => {
        this.events = this.events.filter(currentEvent => currentEvent.id !== event.id);
        this.rebuildStateFromEvents(!deletingLatestEvent);
        this.synchronized = false;
        this.persistState();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readBackendError(error) ?? 'Ocurrió un error inesperado.';
      },
    });
  }

  /** Reconstruye marcador, posesión e historial recorriendo los eventos. */
  private rebuildStateFromEvents(preservePossession = false): void {
    const scoreboard = { home: 0, away: 0 };
    const history: HistoryItem[] = [];

    for (const event of this.events) {
      const eventType = this.eventTypeById(event.eventTypeId);
      if (!eventType) {
        continue;
      }

      const counts = countsAsScoring(eventType, event.attributes);
      if (counts) {
        const points = eventType.points ?? 0;
        if (event.teamPossession === 'OPPONENT') {
          scoreboard.away += points;
        } else {
          scoreboard.home += points;
        }
      }

      const playerNumber = this.readPlayerNumber(event);
      history.unshift({
        id: event.id,
        minute: this.formatEventMinute(event.matchTime),
        description: this.buildEventDescription(
          eventType,
          playerNumber,
          event.teamPossession,
          `${scoreboard.home}-${scoreboard.away}`,
          counts,
        ),
      });

    }

    this.scoreboard = scoreboard;
    if (!preservePossession) {
      const latestEvent = this.events[this.events.length - 1];
      const latestEventType = latestEvent
        ? this.eventTypeById(latestEvent.eventTypeId)
        : undefined;

      if (latestEvent && latestEventType) {
        this.currentPossession = latestEventType.affectsPossession
          ? this.nextPossession(latestEvent.teamPossession)
          : latestEvent.teamPossession;
      }
    }
    this.history = history.slice(0, 12);
  }

  /** Busca un tipo de evento por su identificador. */
  private eventTypeById(eventTypeId: string): LiveCaptureEventType | undefined {
    return this.eventTypes.find(eventType => eventType.id === eventTypeId);
  }

  /** Lee el número de jugador almacenado en los atributos del evento. */
  private readPlayerNumber(event: LocalMatchEvent): number | null {
    const value = event.attributes?.['playerNumber'];
    return typeof value === 'number' ? value : null;
  }

  /** Formatea el instante del evento para mostrarlo en el historial. */
  private formatEventMinute(matchTime: number | null): string {
    return this.formatClock(matchTime ?? 0);
  }

  /**
   * Arma la descripción legible del historial para un evento, incluyendo
   * el número de jugador (si tiene) y, para eventos de anotación, el
   * marcador resultante.
   */
  private buildEventDescription(
    event: LiveCaptureEventType,
    player: number | null,
    possession: Possession = this.currentPossession,
    score = `${this.scoreboard.home}-${this.scoreboard.away}`,
    counts = true,
  ): string {
    const playerTag = player != null ? ` #${player}` : '';

    if (event.isScoring) {
      const name = counts ? event.name : `${event.name} (errado)`;
      return `${name}${playerTag} — ${this.teamForPossession(possession)} ${score}`;
    }

    if (possession === 'NEUTRAL') {
      return `${event.name}${playerTag}`;
    }

    return `${event.name}${playerTag} — ${this.teamForPossession(possession)}`;
  }

  private teamForPossession(possession: Possession): string {
    switch (possession) {
      case 'OPPONENT':
        return this.awayTeam;
      case 'NEUTRAL':
        return 'Neutro';
      case 'OWN':
      default:
        return this.homeTeam;
    }
  }

  /** Resuelve el nombre a mostrar del equipo que tiene la posesión actualmente. */
  /** Devuelve el nombre del equipo que tiene la posesión actual. */
  private teamInPossession(): string {
    return this.teamForPossession(this.currentPossession);
  }

  /** Alterna la posesión entre `own` y `opponent`; `neutral` siempre resuelve a `own`. */
  /** Calcula qué equipo tendrá la posesión después de un evento. */
  private nextPossession(possession: Possession): Possession {
    if (possession === 'OWN') {
      return 'OPPONENT';
    }

    if (possession === 'OPPONENT') {
      return 'OWN';
    }

    return 'OWN';
  }

  /**
   * Mapea un tipo de evento a la variante visual (color) que debe usar su
   * chip. Se usa desde el template vía `eventVariant(event)`.
   */
  eventVariant(event: LiveCaptureEventType): EventVariant {
    if (event.category === 'DEFENSE' && event.name.toLowerCase().includes('fallado')) {
      return 'danger';
    }

    if (event.isScoring) {
      return 'success';
    }

    if (event.category === 'POSSESSION' || event.category === 'NEUTRAL') {
      return 'warning';
    }

    return 'default';
  }

  /**
   * Agrupa la lista plana de tipos de evento que llega del backend en
   * {@link EventCategoryGroup}s por `groupName`, descartando los eventos inactivos.
   */
  private groupEventTypes(eventTypes: LiveCaptureEventType[]): EventCategoryGroup[] {
    return eventTypes
      .filter(event => event.isActive !== false)
      .reduce<EventCategoryGroup[]>((categories, event) => {
        const category = categories.find(item => item.name === event.groupName);

        if (category) {
          category.events.push({ ...event });
        } else {
          categories.push({ name: event.groupName, events: [{ ...event }] });
        }

        return categories;
      }, []);
  }

  togglePeriod() {
    if (this.period >= this.periods.length) {
      return;
    }

    this.period += 1;
    this.periodLabel = this.periods[this.period - 1];
    this.capture = null;
    this.synchronized = false;

    if (this.period === this.periods.length) {
      this.clockPaused = true;
      this.stopClock();
    }

    this.persistState();
  }

  private readBackendError(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return null;
  }

  // ───────────────────────── Captura de eventos (modal por pasos) ─────────────────────────

  /**
   * Arma los botones de los 15 jugadores en cancha a partir del roster guardado.
   * TODO(cambio): cuando se defina la lógica de cambios, esta lista debe derivarse
   * de los titulares más los eventos `Cambio` del partido.
   */
  private buildSlots(): void {
    const slot = (number: number): SlotView => ({
      number,
      name: this.shortName(this.playersByStartingNumber.get(number)?.fullName),
    });
    this.forwardSlots = Array.from({ length: 8 }, (_, index) => slot(index + 1));
    this.backSlots = Array.from({ length: 7 }, (_, index) => slot(index + 9));
  }

  /** Apellido para el botón: «Apellido, Nombre» → Apellido; «Nombre Apellido» → Apellido. */
  private shortName(fullName: string | undefined): string {
    if (!fullName) {
      return '';
    }
    const comma = fullName.indexOf(',');
    if (comma > 0) {
      return fullName.slice(0, comma).trim();
    }
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  }

  get captureStep(): CaptureStep | null {
    return this.capture ? this.capture.steps[this.capture.stepIndex] ?? null : null;
  }

  get captureField(): TemplateField | null {
    return this.captureStep?.kind === 'field' ? this.captureStep.field ?? null : null;
  }

  /** Abre el modal con los pasos del evento, o lo guarda directo si no tiene ninguno. */
  private openCapture(
    event: LiveCaptureEventType,
    eventId: string,
    possession: Possession,
    lockedTeam: CaptureTeam | null,
  ): void {
    const steps: CaptureStep[] = [];
    if (event.requiresPlayer) {
      steps.push({ kind: 'player' });
    }
    liveFields(event).forEach(field => steps.push({ kind: 'field', field }));

    const team: CaptureTeam = lockedTeam ?? (possession === 'OPPONENT' ? 'OPPONENT' : 'OWN');
    if (steps.length === 0) {
      this.commitWithFollowUp(event, eventId, null, null, {}, possession, team);
      return;
    }

    this.capture = {
      event,
      eventId,
      steps,
      stepIndex: 0,
      team,
      canChooseTeam: lockedTeam === null && possession === 'NEUTRAL',
      possession,
      playerNumber: null,
      values: {},
    };
  }

  chooseTeam(team: CaptureTeam): void {
    if (!this.capture?.canChooseTeam) {
      return;
    }
    this.capture.team = team;
    this.capture.playerNumber = null;
  }

  /** `null` = «Sin jugador». */
  pickPlayer(number: number | null): void {
    if (!this.capture) {
      return;
    }
    this.capture.playerNumber = number;
    this.advanceCapture();
  }

  chooseOption(field: TemplateField, value: unknown): void {
    if (!this.capture) {
      return;
    }
    this.capture.values[field.key] = value;
    this.advanceCapture();
  }

  sliderValue(field: TemplateField): number {
    const current = this.capture?.values[field.key];
    if (typeof current === 'number') {
      return current;
    }
    return typeof field.default === 'number' ? field.default : field.min ?? 0;
  }

  onSlider(field: TemplateField, raw: string): void {
    if (this.capture) {
      this.capture.values[field.key] = Math.round(Number(raw));
    }
  }

  confirmSlider(field: TemplateField): void {
    if (!this.capture) {
      return;
    }
    this.capture.values[field.key] = this.sliderValue(field);
    this.advanceCapture();
  }

  skipField(field: TemplateField): void {
    if (!this.capture) {
      return;
    }
    delete this.capture.values[field.key];
    this.advanceCapture();
  }

  captureBack(): void {
    if (this.capture && this.capture.stepIndex > 0) {
      this.capture.stepIndex -= 1;
    }
  }

  /** Cierra el modal sin guardar: descarta el evento, o solo omite el seguimiento si lo era. */
  cancelCapture(): void {
    this.capture = null;
  }

  private advanceCapture(): void {
    const session = this.capture;
    if (!session) {
      return;
    }

    if (session.stepIndex < session.steps.length - 1) {
      session.stepIndex += 1;
      return;
    }

    this.capture = null;
    const player = session.team === 'OWN' && session.playerNumber != null
      ? this.playersByStartingNumber.get(session.playerNumber) ?? null
      : null;
    this.commitWithFollowUp(
      session.event,
      session.eventId,
      player,
      session.playerNumber,
      session.values,
      session.possession,
      session.team,
    );
  }

  /** Guarda el evento y, si su tipo define un seguimiento, abre el modal del seguimiento. */
  private commitWithFollowUp(
    event: LiveCaptureEventType,
    eventId: string,
    player: AvailablePlayer | null,
    playerNumber: number | null,
    values: Record<string, unknown>,
    possession: Possession,
    team: CaptureTeam,
  ): void {
    const attributes: Record<string, unknown> = {
      ...values,
      ...(playerNumber != null ? { playerNumber } : {}),
    };
    const followUp = event.followUpEventTypeId
      ? this.eventTypeById(event.followUpEventTypeId)
      : undefined;

    this.commitEvent(
      event,
      eventId,
      player,
      Object.keys(attributes).length > 0 ? attributes : undefined,
      followUp ? () => this.openCapture(followUp, this.createHistoryId(), possession, team) : undefined,
      possession,
    );
  }
}