import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../services/match.service';
import { EventService } from '../services/event.service';
import { EventTypeService } from '../services/event-type.service';
import { LiveCaptureCacheService } from '../services/live-capture-cache.service';
import { LiveCaptureService } from '../services/live-capture.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchTimelineEventResponse } from '../types/event.types';
import { MatchReviewStore } from './store/match-review.store';

export interface TimelineOccurrence {
  timeMinutes: number;
  matchTimeFormatted: string;
  realTimeFormatted: string;
  player: string;
  hasPlayer: boolean;
}

export interface TimelineTrack {
  eventTypeId: string;
  eventName: string;
  occurrences: TimelineOccurrence[];
  color: string;
}

export interface ChronologicalEventItem {
  id: string;
  period: number;
  matchTime: number;
  matchTimeFormatted: string;
  realTimeFormatted: string;
  eventName: string;
  player: string;
  hasPlayer: boolean;
  color: string;
}

@Component({
  selector: 'app-post-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.css'
})
export class PostMatchComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly eventService = inject(EventService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly cacheService = inject(LiveCaptureCacheService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly toastService = inject(ToastService);
  readonly userContext = inject(UserContextService);
  readonly store = inject(MatchReviewStore);

  readonly userClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  matchId = '';

  // Estado reactivo primario (Signals)
  readonly events = signal<MatchTimelineEventResponse[]>([]);
  readonly opponent = signal<string>('Cargando...');
  readonly errorMessage = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly eventTypesDiccionario = signal<{ [id: string]: string }>({});

  // Estado reactivo derivado (Computed)
  readonly maxMatchDuration = computed<number>(() => {
    let max = 80;
    for (const ev of this.events()) {
      const minutes = (ev.matchTime ?? 0) / 60;
      if (minutes > max) {
        max = Math.ceil(minutes);
      }
    }
    return max;
  });

  readonly timelineTicks = computed<number[]>(() => {
    const ticks: number[] = [];
    const max = this.maxMatchDuration();
    for (let i = 0; i <= max; i += 5) {
      ticks.push(i);
    }
    return ticks;
  });

  readonly timelineTracks = computed<TimelineTrack[]>(() => {
    const trackMap = new Map<string, { seconds: number; realTime: string | null; playerId: string | null; playerName: string | null; eventTypeName: string }[]>();
    const dict = this.eventTypesDiccionario();

    for (const event of this.events()) {
      if (!trackMap.has(event.eventTypeId)) {
        trackMap.set(event.eventTypeId, []);
      }
      const eventName = event.eventTypeName || dict[event.eventTypeId] || 'Evento';
      trackMap.get(event.eventTypeId)!.push({
        seconds: event.matchTime ?? 0,
        realTime: event.realTime ?? null,
        playerId: event.playerId ?? null,
        playerName: event.playerName ?? null,
        eventTypeName: eventName
      });
    }

    const tracks: TimelineTrack[] = [];
    trackMap.forEach((occurrences, id) => {
      const name = occurrences[0]?.eventTypeName || dict[id] || 'Evento';
      const occurrencesWithData: TimelineOccurrence[] = occurrences.map(occ => {
        const hasPlayer = Boolean(occ.playerId);
        const playerName = occ.playerName || (hasPlayer ? 'Jugador' : 'Sin jugador asignado');

        return {
          timeMinutes: occ.seconds / 60,
          matchTimeFormatted: this.formatMatchTime(occ.seconds),
          realTimeFormatted: this.formatRealTime(occ.realTime),
          player: playerName,
          hasPlayer: hasPlayer
        };
      });

      tracks.push({
        eventTypeId: id,
        eventName: name,
        occurrences: occurrencesWithData,
        color: this.getEventColor(name)
      });
    });

    return tracks;
  });

  readonly chronologicalEvents = computed<ChronologicalEventItem[]>(() => {
    const dict = this.eventTypesDiccionario();
    const list: ChronologicalEventItem[] = this.events().map(event => {
      const eventName = event.eventTypeName || dict[event.eventTypeId] || 'Evento';
      const hasPlayer = Boolean(event.playerId);
      const playerName = event.playerName || (hasPlayer ? 'Jugador' : 'Sin jugador asignado');

      return {
        id: event.id,
        period: event.period ?? 1,
        matchTime: event.matchTime ?? 0,
        matchTimeFormatted: this.formatMatchTime(event.matchTime),
        realTimeFormatted: this.formatRealTime(event.realTime),
        eventName: eventName,
        player: playerName,
        hasPlayer: hasPlayer,
        color: this.getEventColor(eventName)
      };
    });

    return list.sort((a, b) => {
      if (a.period !== b.period) {
        return a.period - b.period;
      }
      return a.matchTime - b.matchTime;
    });
  });

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    if (this.matchId) {
      this.loadMatchDetails();
      this.loadEventTypesAndEvents();
    }
  }

  loadMatchDetails(): void {
    this.matchService.getMatchById(this.matchId).subscribe({
      next: (match) => {
        this.opponent.set(match.opponent || 'Visitante');
        if (match.startedAt) {
          this.store.matchStartTime.set(match.startedAt);
        }
      },
      error: () => {
        this.toastService.error('No se pudieron obtener los detalles del partido');
      }
    });
  }

  loadEventTypesAndEvents(): void {
    this.eventTypeService.getAll().subscribe({
      next: (types) => {
        const dict: { [id: string]: string } = {};
        types.forEach(type => {
          dict[type.id] = type.name;
        });
        this.eventTypesDiccionario.set(dict);
        this.store.setEventTypes(dict);
        this.loadEvents();
      },
      error: () => {
        this.cacheService.getEventTypes().then(types => {
          const dict: { [id: string]: string } = {};
          types.forEach(type => {
            dict[type.id] = type.name;
          });
          this.eventTypesDiccionario.set(dict);
          this.store.setEventTypes(dict);
          this.loadEvents();
        });
      }
    });
  }

  async loadEvents(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await firstValueFrom(this.liveCaptureService.syncPendingEvents(this.matchId));
    } catch (syncError) {
      // Sync local previo no bloqueante
    }

    try {
      const remoteEvents = await firstValueFrom(this.eventService.getByMatchPostMatch(this.matchId));
      this.events.set(remoteEvents);
      this.store.setEvents(remoteEvents);
    } catch (error: any) {
      if (error?.status === 409 || error?.error?.includes?.('cerrado')) {
        const msg = typeof error.error === 'string'
          ? error.error
          : (error.error?.message || 'El partido aún no se encuentra cerrado.');
        this.errorMessage.set(msg);
        this.toastService.warning(msg);
        this.isLoading.set(false);
        return;
      }

      try {
        const localEvents = await this.cacheService.getEventsByMatch(this.matchId);
        const dict = this.eventTypesDiccionario();
        const mapped = localEvents.map(e => ({
          id: e.id,
          eventTypeId: e.eventTypeId,
          eventTypeName: dict[e.eventTypeId] || 'Evento',
          playerId: e.playerId,
          playerName: e.playerId ? 'Jugador' : null,
          playerJerseyNumber: null,
          matchTime: e.matchTime ?? 0,
          realTime: e.realTime ?? new Date().toISOString(),
          period: e.period ?? 1,
          teamPossession: e.teamPossession
        }));
        this.events.set(mapped);
        this.store.setEvents(mapped);
      } catch (localError) {
        const msg = 'No se pudieron cargar los eventos del partido.';
        this.errorMessage.set(msg);
        this.toastService.error(msg);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  getEventColor(eventName: string): string {
    const nameStr = eventName.toLowerCase();

    if (nameStr.includes('try')) return '#2e7d32';
    if (nameStr.includes('tackle')) return '#16324f';
    if (nameStr.includes('penal') || nameStr.includes('expulsión') || nameStr.includes('lesión') || nameStr.includes('amarilla') || nameStr.includes('roja')) return '#b42318';
    if (nameStr.includes('line') || nameStr.includes('scrum') || nameStr.includes('turnover')) return '#d96a0a';
    if (nameStr.includes('drop') || nameStr.includes('conversión')) return '#7c3aed';

    return '#204b22';
  }

  formatMatchTime(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatRealTime(isoString: string | null | undefined): string {
    if (!isoString) return 'Sin registro';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ')';
    } catch {
      return isoString;
    }
  }

  comeBack(): void {
    this.router.navigate(['/match-selection']);
  }
}
