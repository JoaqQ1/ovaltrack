import { Component, OnInit, inject } from '@angular/core';
import {
  EventCategoryGroup,
  EventVariant,
  HistoryItem,
  LiveCaptureBackendEventType,
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
  event: LiveCaptureBackendEventType;
  /** Id pre-generado para la entrada de historial que producirá esta selección una vez confirmada. */
  eventId: string;
  /** Si la columna de jugadores del equipo local debería estar habilitada. */
  homeEnabled: boolean;
  /** Si la columna de jugadores del equipo visitante debería estar habilitada. */
  awayEnabled: boolean;
}

/**
 * Una copia completa del estado mutable de la UI, usada para implementar el
 * "deshacer" (undo).
 *
 * Cada propiedad acá es una copia (nunca una referencia compartida) para
 * que mutaciones posteriores al estado en vivo no puedan filtrarse a un
 * snapshot ya guardado.
 */
interface LiveCaptureSnapshot {
  scoreboard: { home: number; away: number };
  clockPaused: boolean;
  currentPossession: Possession;
  synchronized: boolean;
  periodLabel: string;
  categories: EventCategoryGroup[];
  history: HistoryItem[];
  pendingSelection: PendingPlayerSelection | null;
}

const POSSESSIONS: readonly Possession[] = ['own', 'neutral', 'opponent'] as const;

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
export class CargaEnVivoComponent implements OnInit {

  private readonly liveCaptureService = inject(LiveCaptureService);

  /** Estados de posesión, en el orden en que se renderizan en la barra de posesión. */
  readonly possessions = POSSESSIONS;

  /** Números de camiseta del 1 al 15, renderizados en ambas columnas de jugadores. */
  readonly numeracionColumna = Array.from({ length: 15 }, (_, index) => index + 1);

  homeTeam = '';
  awayTeam = '';
  scoreboard = { home: 0, away: 0 };
  gameClock = '--:--';
  periodLabel = '';
  synchronized = false;
  clockPaused = false;

  /**
   * El evento que actualmente espera un número de jugador, o `null` cuando
   * no hay ninguna selección en curso. Las condiciones `[disabled]` del
   * template (chips de evento y columnas de números) se bindean contra
   * esta propiedad.
   */
  pendingSelection: PendingPlayerSelection | null = null;

  currentPossession: Possession = 'own';
  categories: EventCategoryGroup[] = [];
  history: HistoryItem[] = [];

  /** Pila de snapshots para {@link undoLastEvent}, el más reciente al final. */
  private readonly undoStack: LiveCaptureSnapshot[] = [];

  /** Snapshot tomado justo antes de confirmar cada evento, indexado por id de historial, para {@link undoHistoryEvent}. */
  private readonly historySnapshots = new Map<string, LiveCaptureSnapshot>();

  private nextHistoryId = 0;

  ngOnInit(): void {
    this.liveCaptureService.getLiveCaptureBootstrap({
      clubId: 'club-pmrc',
      divisionId: 'division-primera',
      matchId: 'match-pmrc-drc-001',
    }).subscribe(response => {
      const state = response.state;
      this.homeTeam = state.homeTeam;
      this.awayTeam = state.awayTeam;
      this.scoreboard = { ...state.scoreboard };
      this.gameClock = state.gameClock;
      this.periodLabel = state.periodLabel;
      this.synchronized = state.synchronized;
      this.clockPaused = state.clockPaused;
      this.currentPossession = state.currentPossession;
      this.categories = this.groupEventTypes(response.eventTypes);
      this.history = state.history.map((item, index) => this.normalizeHistoryItem(item, index));
      this.undoStack.length = 0;
      this.historySnapshots.clear();
    });
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
   * Guarda un snapshot para deshacer primero, ya que es un cambio disparado directamente por el usuario.
   */
  selectPossession(possession: Possession): void {
    this.pushSnapshot();
    this.currentPossession = possession;
    this.synchronized = false;
  }

  /**
   * Maneja el toque sobre un chip de evento.
   *
   * Si el evento necesita un número de jugador, esto solo abre una
   * {@link PendingPlayerSelection} — el marcador, la posesión y el
   * historial quedan intactos hasta que {@link onPlayerNumberTap} confirme
   * el jugador. Caso contrario, el evento se confirma de inmediato vía
   * {@link commitEvent}.
   *
   * En ambos casos se guarda un snapshot para deshacer, de modo que
   * `undoLastEvent` pueda revertir tanto un evento ya completado como una
   * selección todavía en curso.
   */
  onEventTap(event: LiveCaptureBackendEventType): void {
    this.pushSnapshot();

    if (event.requiresPlayer) {
      this.pendingSelection = {
        event,
        eventId: this.createHistoryId(),
        homeEnabled: this.currentPossession !== 'opponent',
        awayEnabled: this.currentPossession !== 'own',
      };
      return;
    }

    this.commitEvent(event, this.createHistoryId(), null);
  }

  /**
   * Maneja el toque sobre un círculo de número de jugador, resolviendo la
   * {@link pendingSelection} actual si existe.
   *
   * Se ignora silenciosamente (no hace nada) cuando no hay selección
   * pendiente, o cuando `team` no corresponde a una columna actualmente
   * habilitada — esto protege contra clicks perdidos que lleguen a una
   * columna que debería estar deshabilitada.
   *
   * @param playerNumber Número de camiseta tocado.
   * @param team De qué columna vino el toque.
   */
  onPlayerNumberTap(playerNumber: number, team: 'own' | 'opponent'): void {
    if (!this.pendingSelection) {
      return;
    }

    const teamIsEnabled = team === 'own'
      ? this.pendingSelection.homeEnabled
      : this.pendingSelection.awayEnabled;

    if (!teamIsEnabled) {
      return;
    }

    this.commitEvent(this.pendingSelection.event, this.pendingSelection.eventId, playerNumber);
    this.pendingSelection = null;
  }

  /**
   * Aplica los efectos de un evento sobre el estado en vivo: marcador,
   * posesión e historial. Este es el único lugar donde un evento pasa
   * a estar realmente "registrado" — se usa tanto para eventos que nunca
   * necesitaron jugador como para eventos resueltos vía
   * {@link onPlayerNumberTap}.
   *
   * También guarda un snapshot previo a la confirmación, indexado por
   * `eventId`, para que {@link undoHistoryEvent} pueda revertir después
   * solo esta entrada puntual.
   *
   * @param event El tipo de evento que se está registrando.
   * @param eventId Id de historial pre-generado (de {@link createHistoryId}).
   * @param player Número de camiseta asociado al evento, o `null` si no requería uno.
   */
  private commitEvent(event: LiveCaptureBackendEventType, eventId: string, player: number | null): void {
    const snapshotBefore = this.createSnapshot();

    this.applyScoreImpact(event);

    const newItem: HistoryItem = {
      id: eventId,
      minute: this.gameClock,
      description: this.buildEventDescription(event, player),
    };

    if (event.affectsPossession) {
      this.currentPossession = this.nextPossession(this.currentPossession);
    }

    this.historySnapshots.set(eventId, snapshotBefore);
    this.history = [newItem, ...this.history].slice(0, 12);
    this.synchronized = false;
  }

  /** Revierte la última acción del usuario (evento, cambio de posesión o toggle de reloj), si hay alguna. */
  undoLastEvent(): void {
    const snapshot = this.undoStack.pop();

    if (!snapshot) {
      return;
    }

    this.restoreSnapshot(snapshot);
  }

  /**
   * Revierte una entrada específica del historial al estado justo antes de
   * que se confirmara, y luego la remueve de la lista visible.
   *
   * Si no hay snapshot guardado para este id (por ejemplo, porque vino
   * cargada desde el backend al iniciar en vez de confirmarse localmente),
   * la entrada simplemente se elimina sin alterar ningún otro estado.
   */
  undoHistoryEvent(historyId: string): void {
    const snapshot = this.historySnapshots.get(historyId);

    if (!snapshot) {
      this.history = this.history.filter(item => (item.id ?? `${item.minute}-${item.description}`) !== historyId);
      return;
    }

    this.historySnapshots.delete(historyId);
    this.history = this.history.filter(item => (item.id ?? `${item.minute}-${item.description}`) !== historyId);
    this.restoreSnapshot(snapshot);
  }

  /** Elimina una entrada del historial sin revertir ningún estado (a diferencia de {@link undoHistoryEvent}). */
  removeHistoryEvent(historyId: string): void {
    this.historySnapshots.delete(historyId);
    this.history = this.history.filter(item => (item.id ?? `${item.minute}-${item.description}`) !== historyId);
  }

  /** Pausa o reanuda el reloj del partido. Guarda un snapshot para deshacer primero. */
  toggleClock(): void {
    this.pushSnapshot();
    this.clockPaused = !this.clockPaused;
    this.synchronized = false;
  }

  /**
   * Apila un snapshot del estado actual en la pila de deshacer, limitando
   * la pila a 20 entradas (se descarta la más vieja primero) para acotar
   * el uso de memoria.
   */
  private pushSnapshot(): void {
    this.undoStack.push(this.createSnapshot());

    if (this.undoStack.length > 20) {
      this.undoStack.shift();
    }
  }

  /** Copia el estado mutable de la UI en un {@link LiveCaptureSnapshot}. */
  private createSnapshot(): LiveCaptureSnapshot {
    return {
      scoreboard: { ...this.scoreboard },
      clockPaused: this.clockPaused,
      currentPossession: this.currentPossession,
      synchronized: this.synchronized,
      periodLabel: this.periodLabel,
      categories: this.categories.map(category => ({
        name: category.name,
        events: category.events.map(event => ({ ...event })),
      })),
      history: this.history.map(item => ({ ...item })),
      pendingSelection: this.pendingSelection
        ? { ...this.pendingSelection, event: { ...this.pendingSelection.event } }
        : null,
    };
  }

  /** Garantiza que una entrada de historial cargada desde el backend tenga un id local estable. */
  private normalizeHistoryItem(item: HistoryItem, index: number): HistoryItem {
    return {
      ...item,
      id: item.id ?? `history-${index}-${item.minute}-${item.description}`,
    };
  }

  /** Genera un id único y distinguible para una nueva entrada de historial. */
  private createHistoryId(): string {
    this.nextHistoryId += 1;
    return `history-${Date.now()}-${this.nextHistoryId}`;
  }

  /**
   * Restaura el estado completo de la UI a partir de un snapshot, por
   * ejemplo desde {@link undoLastEvent} o {@link undoHistoryEvent}.
   */
  private restoreSnapshot(snapshot: LiveCaptureSnapshot): void {
    this.scoreboard = { ...snapshot.scoreboard };
    this.clockPaused = snapshot.clockPaused;
    this.currentPossession = snapshot.currentPossession;
    this.synchronized = snapshot.synchronized;
    this.periodLabel = snapshot.periodLabel;
    this.categories = snapshot.categories.map(category => ({
      name: category.name,
      events: category.events.map(event => ({ ...event })),
    }));
    this.history = snapshot.history.map((item, index) => this.normalizeHistoryItem(item, index));
    this.pendingSelection = snapshot.pendingSelection
      ? { ...snapshot.pendingSelection, event: { ...snapshot.pendingSelection.event } }
      : null;
  }

  /**
   * Suma los puntos de un evento al marcador, si es un evento de anotación.
   * Los puntos se suman al lado que tiene la posesión en ese momento.
   */
  private applyScoreImpact(event: LiveCaptureBackendEventType): void {
    if (!event.isScoring) {
      return;
    }

    const points = event.points ?? 0;

    if (this.currentPossession === 'opponent') {
      this.scoreboard.away += points;
      return;
    }

    this.scoreboard.home += points;
  }

  /**
   * Arma la descripción legible del historial para un evento, incluyendo
   * el número de jugador (si tiene) y, para eventos de anotación, el
   * marcador resultante.
   */
  private buildEventDescription(event: LiveCaptureBackendEventType, player: number | null): string {
    const score = `${this.scoreboard.home}-${this.scoreboard.away}`;
    const playerTag = player != null ? ` #${player}` : '';

    if (event.isScoring) {
      return `${event.name}${playerTag} — ${this.teamInPossession()} ${score}`;
    }

    if (this.currentPossession === 'neutral') {
      return `${event.name}${playerTag}`;
    }

    return `${event.name}${playerTag} — ${this.teamInPossession()}`;
  }

  /** Resuelve el nombre a mostrar del equipo que tiene la posesión actualmente. */
  private teamInPossession(): string {
    switch (this.currentPossession) {
      case 'opponent':
        return this.awayTeam;
      case 'neutral':
        return 'Neutro';
      case 'own':
      default:
        return this.homeTeam;
    }
  }

  /** Alterna la posesión entre `own` y `opponent`; `neutral` siempre resuelve a `own`. */
  private nextPossession(possession: Possession): Possession {
    if (possession === 'own') {
      return 'opponent';
    }

    if (possession === 'opponent') {
      return 'own';
    }

    return 'own';
  }

  /**
   * Mapea un tipo de evento a la variante visual (color) que debe usar su
   * chip. Se usa desde el template vía `eventVariant(event)`.
   */
  eventVariant(event: LiveCaptureBackendEventType): EventVariant {
    if (event.category === 'defense' && event.id.includes('fallado')) {
      return 'danger';
    }

    if (event.isScoring) {
      return 'success';
    }

    if (event.category === 'possession' || event.category === 'neutral') {
      return 'warning';
    }

    return 'default';
  }

  /**
   * Agrupa la lista plana de tipos de evento que llega del backend en
   * {@link EventCategoryGroup}s por `groupName`, descartando los eventos inactivos.
   */
  private groupEventTypes(eventTypes: LiveCaptureBackendEventType[]): EventCategoryGroup[] {
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