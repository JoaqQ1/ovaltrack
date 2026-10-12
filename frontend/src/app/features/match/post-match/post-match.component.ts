import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../services/match.service';
import { EventService } from '../services/event.service';
import { EventTypeService } from '../services/event-type.service';
import { RosterService } from '../services/roster.service';
import { LiveCaptureCacheService } from '../services/live-capture-cache.service';
import { LiveCaptureService } from '../services/live-capture.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchReviewStore } from './store/match-review.store';
import { PostMatchKpisComponent } from './components/post-match-kpis/post-match-kpis.component';
import { PostMatchTimelineComponent } from './components/post-match-timeline/post-match-timeline.component';
import { PostMatchTableComponent } from './components/post-match-table/post-match-table.component';
import { PostMatchPanelComponent } from './components/post-match-panel/post-match-panel.component';

@Component({
  selector: 'app-post-match',
  standalone: true,
  imports: [
    CommonModule,
    PostMatchKpisComponent,
    PostMatchTimelineComponent,
    PostMatchTableComponent,
    PostMatchPanelComponent
  ],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.css'
})
export class PostMatchComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly eventService = inject(EventService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly rosterService = inject(RosterService);
  private readonly cacheService = inject(LiveCaptureCacheService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly toastService = inject(ToastService);
  readonly userContext = inject(UserContextService);
  readonly store = inject(MatchReviewStore);

  readonly userClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  @ViewChild(PostMatchPanelComponent) panel!: PostMatchPanelComponent;

  matchId = '';

  // Estado del contenedor
  readonly opponent = signal<string>('Cargando...');
  readonly errorMessage = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly eventTypesDiccionario = signal<{ [id: string]: string }>({});

  onEditRequested(): void {
    if (this.panel) {
      this.panel.openEditModal();
    }
  }

  onDeleteRequested(): void {
    if (this.panel) {
      this.panel.openDeleteModal();
    }
  }

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    if (this.matchId) {
      this.store.setMatchId(this.matchId);
      this.loadMatchDetails();
      this.loadRoster();
      this.loadEventTypesAndEvents();
    }
  }

  loadRoster(): void {
    this.rosterService.getAvailablePlayers(this.matchId).subscribe({
      next: (players) => {
        this.store.setAvailablePlayers(players);
      },
      error: () => {
        // Fallback no bloqueante si la división no tiene jugadores cargados
      }
    });
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
        this.store.setEventTypesList(types);
        this.loadEvents();
      },
      error: () => {
        this.cacheService.getEventTypes().then(types => {
          const dict: { [id: string]: string } = {};
          types.forEach(type => {
            dict[type.id] = type.name;
          });
          this.eventTypesDiccionario.set(dict);
          this.store.setEventTypesList(types);
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
    } catch {
      // Sync local previo no bloqueante
    }

    try {
      await firstValueFrom(this.liveCaptureService.hydrateMatchEvents(this.matchId));
    } catch {
      // El contenido local sigue disponible si el backend no responde.
    }

    try {
      const remoteEvents = await firstValueFrom(this.eventService.getByMatchPostMatch(this.matchId));
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
        this.store.setEvents(mapped);
      } catch {
        const msg = 'No se pudieron cargar los eventos del partido.';
        this.errorMessage.set(msg);
        this.toastService.error(msg);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  comeBack(): void {
    this.router.navigate(['/match-selection']);
  }
}
