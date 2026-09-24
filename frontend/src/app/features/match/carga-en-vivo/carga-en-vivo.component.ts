import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  EventCategoryGroup,
  EventVariant,
  HistoryItem,
  LiveCapturePersistedState,
  LiveCaptureEventType,
  LocalMatchEvent,
  Possession,
} from '../types/live-capture.types';
import { LiveCaptureService } from '../services/live-capture.service';

/**
 * Representa un evento que ya fue tocado pero todavía está esperando a que
 * el usuario elija qué jugador lo realizó.
 *
 * Mientras esto está seteado, todos los chips de evento salvo `event`
 * deberían estar deshabilitados, y solo la(s) columna(s) de números
 * permitidas por `homeEnabled` / `awayEnabled` deberían ser interactivas.
 * El evento no se escribe en `history` (y no afecta el marcador ni la
 * posesión) hasta que la selección se resuelve en
 * {@link CargaEnVivoComponent.onPlayerNumberTap}.
 */
interface PendingPlayerSelection {
  /** El evento del catálogo que disparó esta selección pendiente. */
  event: LiveCaptureEventType;
  /** Id pre-generado para la entrada de historial que producirá esta selección una vez confirmada. */
  eventId: string;
  /** Si la columna de jugadores del equipo local debería estar habilitada. */
  homeEnabled: boolean;
  /** Si la columna de jugadores del equipo visitante debería estar habilitada. */
  awayEnabled: boolean;
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
 * ### Flujo de selección de jugador
 * Algunos tipos de evento (`event.requiresPlayer === true`) necesitan un
 * número de jugador antes de poder confirmarse en el historial. Para esos:
 * 1. {@link onEventTap} guarda un {@link PendingPlayerSelection} en vez de
 *    escribir en el historial de inmediato.
 * 2. El template deshabilita todos los chips de evento salvo el pendiente,
 *    y habilita solo la(s) columna(s) de número correspondiente(s).
 * 3. {@link onPlayerNumberTap} resuelve la selección pendiente llamando a
 *    {@link commitEvent}, y luego la limpia.
 *
 * Los eventos que no requieren jugador van directo a {@link commitEvent}.
 */
@Component({
  selector: 'ot-live-capture',
  standalone: true,
  templateUrl: './carga-en-vivo.component.html',
  styleUrl: './carga-en-vivo.component.css'
})
export class CargaEnVivoComponent implements OnInit, OnDestroy {

  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private matchId = '';

  /** Estados de posesión, en el orden en que se renderizan en la barra de posesión. */
  readonly possessions = POSSESSIONS;

  /** Números de camiseta del 1 al 15, renderizados en ambas columnas de jugadores. */
  readonly numeracionColumna = Array.from({ length: 15 }, (_, index) => index + 1);

  homeTeam = '';
  awayTeam = '';
  scoreboard = { home: 0, away: 0 };
  gameClock = '--:--';
  period = 1;
  periodLabel = '';
  synchronized = false;
  clockPaused = false;

  private clockElapsedSeconds = 0;
  private clockStartedAt: number | null = null;
  private clockTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * El evento que actualmente espera un número de jugador, o `null` cuando
   * no hay ninguna selección en curso. Las condiciones `[disabled]` del
   * template (chips de evento y columnas de números) se bindean contra
   * esta propiedad.
   */
  pendingSelection: PendingPlayerSelection | null = null;

  currentPossession: Possession = 'OWN';
  categories: EventCategoryGroup[] = [];
  history: HistoryItem[] = [];
  errorMessage = '';
  isLoading = true;
  private events: LocalMatchEvent[] = [];

  ngOnInit(): void {
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
        this.scoreboard = { ...state.scoreboard };
        this.gameClock = state.gameClock;
        this.period = state.period ?? 1;
        this.periodLabel = state.periodLabel;
        this.synchronized = state.synchronized;
        this.clockPaused = state.clockPaused;
        this.clockElapsedSeconds = this.parseClock(state.gameClock);
        this.currentPossession = state.currentPossession;
        this.categories = this.groupEventTypes(response.eventTypes);
        this.events = response.recentEvents;
        this.rebuildStateFromEvents();

        if (!this.restorePersistedState(response.persistedState)) {
          if (!this.clockPaused) {
            this.startClock();
          }
          this.persistState();
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el partido. Inténtalo nuevamente.';
        this.isLoading = false;
      },
    });
  }

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

  /**
   * Define qué equipo tiene la posesión actualmente.
  * Cambia la posesión manualmente; los eventos guardan la posesión que tenían
  * al momento de registrarse.
   */
  selectPossession(possession: Possession): void {
    this.currentPossession = possession;
    this.synchronized = false;
    this.persistState();
  }

  /**
   * Maneja el toque sobre un chip de evento.
   *
  * Si ya hay una {@link pendingSelection} en curso, solo el mismo chip sigue
  * habilitado: volver a tocarlo confirma el evento sin jugador. Los demás
  * eventos se ignoran mientras se espera la selección.
   *
   * Si el evento necesita un número de jugador, esto abre una nueva
   * {@link PendingPlayerSelection} — el marcador, la posesión y el
   * historial quedan intactos hasta que {@link onPlayerNumberTap} confirme
   * el jugador. Caso contrario, el evento se confirma de inmediato vía
   * {@link commitEvent}.
   *
  * La selección pendiente se guarda en el estado de UI; el evento completo
  * solo se persiste cuando queda asociado a un jugador.
   */
  onEventTap(event: LiveCaptureEventType): void {
    if (this.pendingSelection) {
      if (this.pendingSelection.event.id === event.id) {
        const pendingEvent = this.pendingSelection;
        this.pendingSelection = null;
        this.commitEvent(pendingEvent.event, pendingEvent.eventId, null);
      }
      return;
    }
    if (event.requiresPlayer) {
      this.pendingSelection = {
        event,
        eventId: this.createHistoryId(),
        homeEnabled: this.currentPossession !== 'OPPONENT',
        awayEnabled: this.currentPossession !== 'OWN',
      };
      this.persistState();
      return;
    }

    this.commitEvent(event, this.createHistoryId(), null);
  }

  onPlayerNumberTap(playerNumber: number, team: 'OWN' | 'OPPONENT'): void {
    if (!this.pendingSelection) {
      return;
    }

    const teamIsEnabled = team === 'OWN'
      ? this.pendingSelection.homeEnabled
      : this.pendingSelection.awayEnabled;
    if (!teamIsEnabled) {
      return;
    }

    const pendingEvent = this.pendingSelection;
    this.pendingSelection = null;
    this.commitEvent(pendingEvent.event, pendingEvent.eventId, playerNumber);
  }

  private commitEvent(event: LiveCaptureEventType, eventId: string, player: number | null): void {
    const timestamp = new Date().toISOString();
    const localEvent: LocalMatchEvent = {
      id: eventId,
      eventTypeId: event.id,
      matchId: this.matchId,
      playerId: null,
      teamPossession: this.currentPossession,
      matchTime: this.parseClock(this.gameClock),
      realTime: timestamp,
      period: null,
      origin: 'live-capture',
      attributes: player == null ? null : { playerNumber: player },
      createdAt: timestamp,
      synchronizedAt: null,
      localSequence: this.nextEventSequence(),
    };

    this.liveCaptureService.saveEvent(localEvent).subscribe({
      next: () => {
        this.events = [...this.events, localEvent];
        this.rebuildStateFromEvents();
        this.synchronized = false;
        this.persistState();
      },
      error: () => {
        this.errorMessage = 'No se pudo guardar el evento. Inténtalo nuevamente.';
      },
    });
  }

  /** Cancela una selección pendiente o elimina el último evento persistido. */
  undoLastEvent(): void {
    if (this.pendingSelection) {
      this.pendingSelection = null;
      this.persistState();
      return;
    }

    const lastEvent = this.latestEvent();
    if (lastEvent) {
      this.deleteEventAndRebuild(lastEvent);
    }
  }

  /** Elimina un evento específico y revierte sus efectos. */
  undoHistoryEvent(historyId: string): void {
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

  private startClock(): void {
    this.stopClock();
    this.clockStartedAt = Date.now();
    this.clockTimer = setInterval(() => this.updateClock(), 250);
  }

  private stopClock(): void {
    if (this.clockTimer !== null) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
    this.clockStartedAt = null;
  }

  private updateClock(): void {
    if (this.clockPaused || this.clockStartedAt === null) {
      return;
    }

    const elapsedSinceStart = Math.floor((Date.now() - this.clockStartedAt) / 1000);
    const nextClock = this.formatClock(this.clockElapsedSeconds + elapsedSinceStart);

    if (nextClock !== this.gameClock) {
      this.gameClock = nextClock;
      this.persistState(false);
    }
  }

  private persistState(updateClock = true): void {
    if (updateClock && !this.clockPaused) {
      this.updateClock();
    }

    const state: LiveCapturePersistedState = {
      matchId: this.matchId,
      gameClock: this.gameClock,
      periodLabel: this.periodLabel,
      period: this.period,
      synchronized: this.synchronized,
      clockPaused: this.clockPaused,
      pendingSelection: this.pendingSelection
        ? { ...this.pendingSelection, event: { ...this.pendingSelection.event } }
        : null,
      clockElapsedSeconds: this.parseClock(this.gameClock),
      savedAt: Date.now(),
      currentPossession: this.currentPossession,
      scoreboard: { ...this.scoreboard },
    };

    this.liveCaptureService.saveLiveCaptureState(state).subscribe({
      error: () => {
        this.errorMessage = 'No se pudo guardar el estado local del partido.';
      },
    });
  }

  private restorePersistedState(state: LiveCapturePersistedState | undefined): boolean {
    if (!state || state.matchId !== this.matchId || !this.isValidPersistedState(state)) {
      return false;
    }

    this.period = state.period;
    this.periodLabel = state.periodLabel;
    this.synchronized = state.synchronized;
    this.pendingSelection = state.pendingSelection
      ? { ...state.pendingSelection, event: { ...state.pendingSelection.event } }
      : null;
    this.clockPaused = state.clockPaused;
    this.clockElapsedSeconds = state.clockElapsedSeconds;
    if (state.currentPossession) {
      this.currentPossession = state.currentPossession;
    }
    if (state.scoreboard) {
      this.scoreboard = { ...state.scoreboard };
    }

    if (this.clockPaused) {
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

  private isValidPersistedState(state: LiveCapturePersistedState): boolean {
    return Number.isInteger(state.period)
      && state.period > 0
      && Number.isFinite(state.clockElapsedSeconds)
      && Number.isFinite(state.savedAt)
      && typeof state.gameClock === 'string'
      && typeof state.periodLabel === 'string'
      && typeof state.clockPaused === 'boolean'
      && typeof state.synchronized === 'boolean';
  }

  private parseClock(clock: string | undefined): number {
    if (!clock) {
      return 0;
    }

    const [minutes, seconds] = clock.split(':').map(Number);
    return Number.isFinite(minutes) && Number.isFinite(seconds)
      ? Math.max(0, minutes * 60 + seconds)
      : 0;
  }

  private formatClock(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private latestEvent(): LocalMatchEvent | undefined {
    return this.events[this.events.length - 1];
  }

  private nextEventSequence(): number {
    return this.events.reduce((highest, event) => Math.max(highest, event.localSequence), 0) + 1;
  }

  private createHistoryId(): string {
    return crypto.randomUUID();
  }

  private deleteEventAndRebuild(event: LocalMatchEvent): void {
    const deletingLatestEvent = this.latestEvent()?.id === event.id;
    this.liveCaptureService.deleteEvent(event.id).subscribe({
      next: () => {
        this.events = this.events.filter(currentEvent => currentEvent.id !== event.id);
        this.rebuildStateFromEvents(!deletingLatestEvent);
        this.synchronized = false;
        this.persistState();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el evento. Inténtalo nuevamente.';
      },
    });
  }

  private rebuildStateFromEvents(preservePossession = false): void {
    let possession: Possession = this.currentPossession;
    const scoreboard = { home: 0, away: 0 };
    const history: HistoryItem[] = [];

    for (const event of this.events) {
      const eventType = this.eventTypeById(event.eventTypeId);
      if (!eventType) {
        continue;
      }

      if (eventType.isScoring) {
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
        ),
      });

      if (eventType.affectsPossession) {
        possession = this.nextPossession(event.teamPossession);
      }
    }

    this.scoreboard = scoreboard;
    if (!preservePossession) {
      this.currentPossession = possession;
    }
    this.history = history.slice(0, 12);
  }

  private eventTypeById(eventTypeId: string): LiveCaptureEventType | undefined {
    return this.categories.flatMap(category => category.events)
      .find(eventType => eventType.id === eventTypeId);
  }

  private readPlayerNumber(event: LocalMatchEvent): number | null {
    const value = event.attributes?.['playerNumber'];
    return typeof value === 'number' ? value : null;
  }

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
  ): string {
    const playerTag = player != null ? ` #${player}` : '';

    if (event.isScoring) {
      return `${event.name}${playerTag} — ${this.teamForPossession(possession)} ${score}`;
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
  private teamInPossession(): string {
    return this.teamForPossession(this.currentPossession);
  }

  /** Alterna la posesión entre `own` y `opponent`; `neutral` siempre resuelve a `own`. */
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
      .filter(event => event.active !== false)
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
}