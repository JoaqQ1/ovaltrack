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
    let maxMinutes = 80; // Estándar mínimo reglamentario de rugby
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
      const eventName = e.eventTypeName || dict[e.eventTypeId] || 'Evento';
      const hasPlayer = Boolean(e.playerId && e.playerId.trim() !== '');
      const playerName = e.playerName || (hasPlayer ? 'Jugador' : 'Sin asignar');
      const seconds = e.matchTime ?? 0;
      const minute = seconds / 60;
      const pct = Math.min(100, Math.max(0, (minute / scale) * 100));

      // Determinar si este evento coincide con los filtros activos
      const matchesPeriod = currentFilters.period === 'ALL' || e.period === currentFilters.period;
      const matchesTeam = currentFilters.team === 'ALL' || e.teamPossession === currentFilters.team;
      const isUnassigned = !hasPlayer && e.teamPossession !== 'OPPONENT';
      const matchesUnassigned = !currentFilters.onlyUnassigned || isUnassigned;
      const matchesSearch = term === '' ||
        playerName.toLowerCase().includes(term) ||
        eventName.toLowerCase().includes(term);
      const matchesLane = !currentFilters.hiddenLaneIds.includes(e.eventTypeId);

      const isMatching = matchesPeriod && matchesTeam && matchesUnassigned && matchesSearch && matchesLane;

      return {
        id: e.id,
        eventTypeId: e.eventTypeId,
        eventTypeName: eventName,
        color: this.resolveEventColor(eventName),
        period: e.period ?? 1,
        matchTime: seconds,
        minute,
        pct,
        matchTimeFormatted: this.formatTimeSeconds(seconds),
        realTime: e.realTime,
        realTimeFormatted: this.formatRealTime(e.realTime),
        playerId: e.playerId ?? null,
        playerName,
        playerJerseyNumber: e.playerJerseyNumber ?? null,
        hasPlayer,
        teamPossession: e.teamPossession,
        isDimmed: !isMatching
      };
    });
  });

  // --- Eventos Visibles (Filtrados para Tabla) ---
  readonly visibleEvents = computed<ReviewEventViewModel[]>(() => {
    return this.allViewModels()
      .filter(ev => !ev.isDimmed)
      .sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;
        return a.matchTime - b.matchTime;
      });
  });

  // --- Cola de Revisión (Pendientes sin jugador) ---
  readonly pendingQueue = computed<ReviewEventViewModel[]>(() => {
    return this.allViewModels()
      .filter(ev => !ev.hasPlayer && ev.teamPossession !== 'OPPONENT')
      .sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;
        return a.matchTime - b.matchTime;
      });
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
    const unassignedEvents = all.filter(e => !e.hasPlayer && e.teamPossession !== 'OPPONENT').length;
    const coveragePercentage = totalEvents > 0
      ? Math.round(((totalEvents - unassignedEvents) / totalEvents) * 100)
      : 100;

    let startTimeFormatted = '--:--:--';
    const explicitStart = this.matchStartTime();
    if (explicitStart) {
      startTimeFormatted = this.formatOnlyTime(explicitStart);
    } else if (all.length > 0) {
      // Tomar la hora del primer evento cronológico
      const sortedByRealTime = [...all].sort((a, b) => a.realTime.localeCompare(b.realTime));
      startTimeFormatted = this.formatOnlyTime(sortedByRealTime[0].realTime);
    }

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
      const newArray = [...current];
      newArray[index] = updated;
      this.rawEvents.set(newArray);
    }
  }

  // --- Utilidades de Formateo y Colores ---

  private resolveEventColor(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('try')) return '#2e7d32'; // Verde
    if (lower.includes('tackle fallado')) return '#2563eb'; // Azul medio (Punto 12)
    if (lower.includes('tackle')) return '#16324f'; // Azul marino oscuro
    if (lower.includes('penal') || lower.includes('infracción') || lower.includes('amarilla') || lower.includes('roja')) {
      return '#b42318'; // Rojo deportivo
    }
    if (lower.includes('line') || lower.includes('scrum') || lower.includes('turnover')) {
      return '#d96a0a'; // Naranja óxido
    }
    if (lower.includes('drop') || lower.includes('conversión')) {
      return '#7c3aed'; // Púrpura
    }
    return '#204b22'; // Salvia primario default
  }

  private formatTimeSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatRealTime(iso: string | null | undefined): string {
    if (!iso) return 'Sin registro';
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ')';
    } catch {
      return iso;
    }
  }

  private formatOnlyTime(iso: string | null | undefined): string {
    if (!iso) return '--:--:--';
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--:--';
    }
  }
}
