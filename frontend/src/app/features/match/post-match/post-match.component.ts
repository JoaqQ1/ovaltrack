import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../services/match.service';
import { EventService } from '../services/event.service';
import { EventTypeService } from '../services/event-type.service';
import { PersonService } from 'src/app/services/person.service';
import { LiveCaptureCacheService } from '../services/live-capture-cache.service';
import { LiveCaptureService } from '../services/live-capture.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LocalMatchEvent } from '../types/event.types';

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

  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);
  private eventService = inject(EventService);
  private eventTypeService = inject(EventTypeService);
  private personService = inject(PersonService);
  private readonly router = inject(Router);
  private readonly cacheService = inject(LiveCaptureCacheService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  readonly userContext = inject(UserContextService);

  readonly userClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  matchId = '';
  events: LocalMatchEvent[] = [];
  chronologicalEvents: ChronologicalEventItem[] = [];
  errorMessage = '';
  isLoading = true;

  opponent = 'Cargando...';
  timelineTracks: TimelineTrack[] = [];
  maxMatchDuration = 80; // Minutos reglamentarios de rugby
  timelineTicks: number[] = [];
  eventTypesDiccionario: { [id: string]: string } = {};
  playerNamesCache = new Map<string, string>();

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
        this.opponent = match.opponent || 'Visitante';
      },
      error: (err) => console.error('Error al cargar detalles del partido:', err)
    });
  }

  loadEventTypesAndEvents(): void {
    this.eventTypeService.getAll().subscribe({
      next: (types) => {
        types.forEach(type => {
          this.eventTypesDiccionario[type.id] = type.name;
        });
        this.loadEvents();
      },
      error: () => {
        this.cacheService.getEventTypes().then(types => {
          types.forEach(type => {
            this.eventTypesDiccionario[type.id] = type.name;
          });
          this.loadEvents();
        });
      }
    });
  }

  async loadEvents(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await firstValueFrom(this.liveCaptureService.syncPendingEvents(this.matchId));
      const remoteEvents = await firstValueFrom(this.eventService.getByMatchPostMatch(this.matchId));
      this.events = remoteEvents.map((event, index) => ({
        ...event,
        localSequence: index + 1,
      }));
      this.buildTimeline();
    } catch (error: any) {
      if (error?.status === 409 || error?.error?.includes?.('cerrado')) {
        this.errorMessage = typeof error.error === 'string'
          ? error.error
          : (error.error?.message || 'El partido aún no se encuentra cerrado.');
        this.isLoading = false;
        return;
      }

      try {
        this.events = await this.cacheService.getEventsByMatch(this.matchId);
        this.buildTimeline();
      } catch (localError) {
        console.error('Error al traer eventos del partido:', localError);
        this.errorMessage = 'No se pudieron cargar los eventos del partido.';
      }
    } finally {
      this.isLoading = false;
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

  buildTimeline(): void {
    const trackMap = new Map<string, { seconds: number; realTime: string | null; playerId: string | null }[]>();
    const uniquePlayerIds = new Set<string>();

    this.maxMatchDuration = 80;

    this.events.forEach(event => {
      const eventSeconds = event.matchTime ?? 0;
      const eventMinutes = eventSeconds / 60;

      if (eventMinutes > this.maxMatchDuration) {
        this.maxMatchDuration = Math.ceil(eventMinutes);
      }

      if (!trackMap.has(event.eventTypeId)) {
        trackMap.set(event.eventTypeId, []);
      }

      if (event.playerId) {
        uniquePlayerIds.add(event.playerId);
      }

      trackMap.get(event.eventTypeId)?.push({
        seconds: eventSeconds,
        realTime: event.realTime ?? null,
        playerId: event.playerId ?? null
      });
    });

    this.fetchPlayerNames(uniquePlayerIds, trackMap);
  }

  fetchPlayerNames(
    playerIds: Set<string>,
    trackMap: Map<string, { seconds: number; realTime: string | null; playerId: string | null }[]>
  ): void {
    let pendingRequests = playerIds.size;

    if (pendingRequests === 0) {
      this.finalizeTimeline(trackMap);
      return;
    }

    playerIds.forEach(id => {
      if (this.playerNamesCache.has(id)) {
        pendingRequests--;
        if (pendingRequests === 0) this.finalizeTimeline(trackMap);
        return;
      }

      this.personService.getPersonById(id).subscribe({
        next: (person) => {
          this.playerNamesCache.set(id, `${person.firstName} ${person.lastName}`);
        },
        error: () => {
          this.playerNamesCache.set(id, 'Jugador desconocido');
        },
        complete: () => {
          pendingRequests--;
          if (pendingRequests === 0) {
            this.finalizeTimeline(trackMap);
          }
        }
      });
    });
  }

  finalizeTimeline(
    trackMap: Map<string, { seconds: number; realTime: string | null; playerId: string | null }[]>
  ): void {
    this.timelineTracks = [];

    trackMap.forEach((occurrences, id) => {
      const occurrencesWithData: TimelineOccurrence[] = occurrences.map(occ => {
        const hasPlayer = Boolean(occ.playerId);
        const playerName = hasPlayer
          ? (this.playerNamesCache.get(occ.playerId!) || 'Desconocido')
          : 'Sin jugador asignado';

        return {
          timeMinutes: occ.seconds / 60,
          matchTimeFormatted: this.formatMatchTime(occ.seconds),
          realTimeFormatted: this.formatRealTime(occ.realTime),
          player: playerName,
          hasPlayer: hasPlayer
        };
      });

      const name = this.getEventName(id);
      this.timelineTracks.push({
        eventTypeId: id,
        eventName: name,
        occurrences: occurrencesWithData,
        color: this.getEventColor(name)
      });
    });

    // Construir lista cronológica completa para la tabla
    this.chronologicalEvents = this.events.map(event => {
      const eventName = this.getEventName(event.eventTypeId);
      const hasPlayer = Boolean(event.playerId);
      const playerName = hasPlayer
        ? (this.playerNamesCache.get(event.playerId!) || 'Desconocido')
        : 'Sin jugador asignado';

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

    // Ordenar cronológicamente: período, luego matchTime
    this.chronologicalEvents.sort((a, b) => {
      if (a.period !== b.period) {
        return a.period - b.period;
      }
      return a.matchTime - b.matchTime;
    });

    // Marcas de regla temporal en minutos (cada 5 minutos)
    this.timelineTicks = [];
    for (let i = 0; i <= this.maxMatchDuration; i += 5) {
      this.timelineTicks.push(i);
    }
  }

  getEventName(eventTypeId: string): string {
    return this.eventTypesDiccionario[eventTypeId] || 'Evento Desconocido';
  }

  comeBack(): void {
    this.router.navigate(['/match-selection']);
  }
}
