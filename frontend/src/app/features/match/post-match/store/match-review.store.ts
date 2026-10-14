import { Injectable, computed, signal } from '@angular/core';
import { MatchTimelineEventResponse } from '../../types/event.types';
import { AvailablePlayer } from '../../types/roster.types';
import { LiveCaptureEventType } from '../../types/event-type.types';
import {
  ReviewEventViewModel,
  ReviewFilters,
  ReviewKpis,
  ReviewPeriodFilter,
  ReviewTimelineLane
} from '../types/match-review.types';

import {
  RUGBY_HALF_TIME_MIN,
  RUGBY_FULL_TIME_MIN,
  EMPTY_TIME_PLACEHOLDER,
  estimateAbsoluteTime as estimateAbsoluteTimeUtil,
  resolveEventColor,
  formatTimeSeconds,
  formatAbsoluteTime,
  formatOnlyTime
} from '../utils/match-review.utils';

export { RUGBY_HALF_TIME_MIN, RUGBY_FULL_TIME_MIN, EMPTY_TIME_PLACEHOLDER };

@Injectable({
  providedIn: 'root'
})
export class MatchReviewStore {

  // --- Estado Primario (Signals) ---
  readonly matchId = signal<string>('');
  readonly rawEvents = signal<MatchTimelineEventResponse[]>([]);
  readonly matchStartTime = signal<string | null>(null);
  readonly selectedEventId = signal<string | null>(null);
  readonly eventTypesDict = signal<Record<string, string>>({});
  readonly eventTypesList = signal<LiveCaptureEventType[]>([]);
  readonly availablePlayers = signal<AvailablePlayer[]>([]);

  readonly filters = signal<ReviewFilters>({
    period: 'ALL',
    team: 'ALL',
    onlyUnassigned: false,
    searchTerm: '',
    hiddenLaneIds: []
  });

  // --- Duración Dinámica y Escala (Eje X) ---
  readonly matchDurationScale = computed<number>(() => {
    let maxMinutes = RUGBY_FULL_TIME_MIN; // Estándar mínimo reglamentario de rugby
    for (const ev of this.rawEvents()) {
      const mins = (ev.matchTime ?? 0) / 60;
      if (mins > maxMinutes) {
        maxMinutes = Math.ceil(mins);
      }
    }
    return maxMinutes;
  });

  // --- Transformación DTO a ViewModels Puros ---
  readonly allViewModels = computed<ReviewEventViewModel[]>(() => {
    const raw = this.rawEvents();
    const dict = this.eventTypesDict();
    const scale = this.matchDurationScale();
    const currentFilters = this.filters();
    const term = currentFilters.searchTerm.trim().toLowerCase();

    return raw.map(e => {
      const vm = this.buildBaseViewModel(e, dict, scale);
      vm.isDimmed = !this.evaluateFilters(vm, currentFilters, term);
      return vm;
    });
  });

  // --- Eventos Visibles (Filtrados para Tabla) ---
  readonly visibleEvents = computed<ReviewEventViewModel[]>(() => {
    return this.allViewModels()
      .filter(ev => !ev.isDimmed)
      .sort((a, b) => this.sortChronologically(a, b));
  });

  // --- Cola de Revisión (Pendientes sin jugador) ---
  readonly pendingQueue = computed<ReviewEventViewModel[]>(() => {
    return this.allViewModels()
      .filter(ev => ev.isUnassigned)
      .sort((a, b) => this.sortChronologically(a, b));
  });

  // --- Evento Actualmente Seleccionado ---
  readonly selectedEvent = computed<ReviewEventViewModel | null>(() => {
    const id = this.selectedEventId();
    const all = this.allViewModels();
    if (!id) {
      // Por defecto sugerir el primer pendiente si existe, sino el primer visible
      const pending = this.pendingQueue();
      if (pending.length > 0) return pending[0];
      const visible = this.visibleEvents();
      return visible.length > 0 ? visible[0] : null;
    }
    return all.find(e => e.id === id) ?? null;
  });

  // --- Carriles de la Línea de Tiempo (Timeline Lanes) ---
  readonly timelineLanes = computed<ReviewTimelineLane[]>(() => {
    const all = this.allViewModels();
    const hidden = new Set(this.filters().hiddenLaneIds);
    const lanesMap = new Map<string, ReviewEventViewModel[]>();

    for (const ev of all) {
      if (!lanesMap.has(ev.eventTypeId)) {
        lanesMap.set(ev.eventTypeId, []);
      }
      lanesMap.get(ev.eventTypeId)!.push(ev);
    }

    const lanes: ReviewTimelineLane[] = [];
    lanesMap.forEach((occurrences, typeId) => {
      const first = occurrences[0];
      lanes.push({
        eventTypeId: typeId,
        eventName: first.eventTypeName,
        color: first.color,
        totalCount: occurrences.length,
        hidden: hidden.has(typeId),
        occurrences
      });
    });

    return lanes;
  });

  // --- KPIs del Resumen Superior ---
  readonly kpis = computed<ReviewKpis>(() => {
    const all = this.allViewModels();
    const totalEvents = all.length;
    const unassignedEvents = all.filter(e => e.isUnassigned).length;
    const coveragePercentage = totalEvents > 0
      ? Math.round(((totalEvents - unassignedEvents) / totalEvents) * 100)
      : 100;

    const startTimeFormatted = this.resolveMatchStartTimeFormatted(all, this.matchStartTime());

    return {
      totalEvents,
      unassignedEvents,
      coveragePercentage,
      startTimeFormatted
    };
  });

  // --- Acciones de Estado (State Mutators) ---

  setEvents(events: MatchTimelineEventResponse[], matchStartTime?: string | null): void {
    this.rawEvents.set(events);
    if (matchStartTime !== undefined) {
      this.matchStartTime.set(matchStartTime);
    }
  }

  setMatchId(id: string): void {
    this.matchId.set(id);
  }

  setAvailablePlayers(players: AvailablePlayer[]): void {
    this.availablePlayers.set(players);
  }

  setEventTypesList(types: LiveCaptureEventType[]): void {
    this.eventTypesList.set(types);
    const dict: Record<string, string> = {};
    types.forEach(t => {
      dict[t.id] = t.name;
    });
    this.eventTypesDict.set(dict);
  }

  setEventTypes(dict: Record<string, string>): void {
    this.eventTypesDict.set(dict);
  }

  selectEvent(id: string | null): void {
    this.selectedEventId.set(id);
  }

  selectNextPending(): void {
    const queue = this.pendingQueue();
    if (queue.length === 0) return;

    const currentId = this.selectedEventId();
    const currentIndex = queue.findIndex(e => e.id === currentId);

    if (currentIndex === -1 || currentIndex === queue.length - 1) {
      this.selectedEventId.set(queue[0].id);
    } else {
      this.selectedEventId.set(queue[currentIndex + 1].id);
    }
  }

  setPeriod(period: ReviewPeriodFilter): void {
    this.filters.update(f => ({ ...f, period }));
  }

  setTeamFilter(team: 'ALL' | 'OWN' | 'OPPONENT'): void {
    this.filters.update(f => ({ ...f, team }));
  }

  toggleOnlyUnassigned(): void {
    this.filters.update(f => ({ ...f, onlyUnassigned: !f.onlyUnassigned}));
  }

  setSearchTerm(term: string): void {
    this.filters.update(f => ({ ...f, searchTerm: term }));
  }

  toggleLane(laneId: string): void {
    this.filters.update(f => {
      const isHidden = f.hiddenLaneIds.includes(laneId);
      const updated = isHidden
        ? f.hiddenLaneIds.filter(id => id !== laneId)
        : [...f.hiddenLaneIds, laneId];
      return { ...f, hiddenLaneIds: updated };
    });
  }

  clearFilters(): void {
    this.filters.set({
      period: 'ALL',
      team: 'ALL',
      onlyUnassigned: false,
      searchTerm: '',
      hiddenLaneIds: []
    });
  }

  removeEvent(eventId: string): void {
    const current = this.rawEvents();
    this.rawEvents.set(current.filter(e => e.id !== eventId));
    if (this.selectedEventId() === eventId) {
      this.selectedEventId.set(null);
    }
  }

  updateEvent(eventId: string, partial: Partial<MatchTimelineEventResponse>): void {
    const current = this.rawEvents();
    const index = current.findIndex(e => e.id === eventId);
    if (index !== -1) {
      const dict = this.eventTypesDict();
      const updated = { ...current[index], ...partial };
      if (partial.eventTypeId && dict[partial.eventTypeId]) {
        updated.eventTypeName = dict[partial.eventTypeId];
      }
      if (partial.playerId !== undefined) {
        const playerObj = this.availablePlayers().find(p => p.id === partial.playerId);
        updated.playerName = playerObj ? playerObj.fullName : null;
        updated.playerJerseyNumber = playerObj ? playerObj.jerseyNumber : null;
      }
      const newArray = [...current];
      newArray[index] = updated;
      this.rawEvents.set(newArray);
    }
  }

  addEvent(event: MatchTimelineEventResponse): void {
    const dict = this.eventTypesDict();
    const eventName = event.eventTypeName || dict[event.eventTypeId] || 'Evento';
    let playerName = event.playerName;
    let playerJerseyNumber = event.playerJerseyNumber;

    if (event.playerId && !playerName) {
      const playerObj = this.availablePlayers().find(p => p.id === event.playerId);
      if (playerObj) {
        playerName = playerObj.fullName;
        playerJerseyNumber = playerObj.jerseyNumber;
      }
    }

    const enrichedEvent: MatchTimelineEventResponse = {
      ...event,
      eventTypeName: eventName,
      playerName: playerName ?? null,
      playerJerseyNumber: playerJerseyNumber ?? null,
      origin: event.origin ?? 'post_capture'
    };

    const current = this.rawEvents();
    const updated = [...current, enrichedEvent].sort((a, b) => {
      const pDiff = (a.period ?? 1) - (b.period ?? 1);
      if (pDiff !== 0) return pDiff;
      const tDiff = (a.matchTime ?? 0) - (b.matchTime ?? 0);
      if (tDiff !== 0) return tDiff;
      const absA = a.absoluteMatchTime ?? 0;
      const absB = b.absoluteMatchTime ?? 0;
      return absA - absB;
    });

    this.rawEvents.set(updated);
    this.selectedEventId.set(enrichedEvent.id);
  }

  /**
   * Estima la hora absoluta para un nuevo evento proyectando el desfase acumulado
   * de pausas del evento previo más cercano en el mismo período.
   */
  estimateAbsoluteTime(newMatchTimeSeconds: number, period: 1 | 2): number {
    return estimateAbsoluteTimeUtil(this.rawEvents(), newMatchTimeSeconds, period);
  }

  // --- Funciones Extraídas (Refactoring Niveles 1 y 2) ---

  private sortChronologically(a: ReviewEventViewModel, b: ReviewEventViewModel): number {
    if (a.period !== b.period) return a.period - b.period;
    if (a.matchTime !== b.matchTime) return a.matchTime - b.matchTime;
    return a.absoluteMatchTime - b.absoluteMatchTime;
  }

  private resolveMatchStartTimeFormatted(allEvents: ReviewEventViewModel[], explicitStart: string | null): string {
    if (explicitStart) {
      return formatOnlyTime(explicitStart);
    }
    return EMPTY_TIME_PLACEHOLDER;
  }

  private buildBaseViewModel(
    e: MatchTimelineEventResponse,
    dict: Record<string, string>,
    scale: number
  ): ReviewEventViewModel {
    const eventName = e.eventTypeName || dict[e.eventTypeId] || 'Evento';
    const hasPlayer = Boolean(e.playerId && e.playerId.trim() !== '');
    const playerName = e.playerName || (hasPlayer ? 'Jugador' : 'Sin asignar');
    const seconds = e.matchTime ?? 0;
    const absSeconds = e.absoluteMatchTime != null
      ? e.absoluteMatchTime
      : this.estimateAbsoluteTime(seconds, (e.period === 2 ? 2 : 1));
    const minute = seconds / 60;
    const pct = Math.min(100, Math.max(0, (minute / scale) * 100));
    const isUnassigned = !hasPlayer && e.teamPossession !== 'OPPONENT';
    const isPostMatch = e.origin === 'post_capture';

    return {
      id: e.id,
      eventTypeId: e.eventTypeId,
      eventTypeName: eventName,
      color: resolveEventColor(eventName),
      period: e.period ?? 1,
      matchTime: seconds,
      minute,
      pct,
      matchTimeFormatted: formatTimeSeconds(seconds),
      absoluteMatchTime: absSeconds,
      absoluteTimeFormatted: formatAbsoluteTime(absSeconds),
      playerId: e.playerId ?? null,
      playerName,
      playerJerseyNumber: e.playerJerseyNumber ?? null,
      hasPlayer,
      isUnassigned,
      teamPossession: e.teamPossession,
      origin: e.origin,
      isPostMatch,
      attributes: e.attributes,
      isDimmed: false
    };
  }

  private evaluateFilters(ev: ReviewEventViewModel, filters: ReviewFilters, term: string): boolean {
    const matchesPeriod = filters.period === 'ALL' || ev.period === filters.period;
    const matchesTeam = filters.team === 'ALL' || ev.teamPossession === filters.team;
    const matchesUnassigned = !filters.onlyUnassigned || ev.isUnassigned;
    const matchesSearch = term === '' ||
      ev.playerName.toLowerCase().includes(term) ||
      ev.eventTypeName.toLowerCase().includes(term);
    const matchesLane = !filters.hiddenLaneIds.includes(ev.eventTypeId);

    return matchesPeriod && matchesTeam && matchesUnassigned && matchesSearch && matchesLane;
  }
}
