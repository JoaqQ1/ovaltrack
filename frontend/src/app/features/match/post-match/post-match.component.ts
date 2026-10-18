import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout.service';
import { MatchService } from '../services/match.service';
import { EventService } from '../services/event.service';
import { EventTypeService } from '../services/event-type.service';
import { RosterService } from '../services/roster.service';
import { LiveCaptureCacheService } from '../services/live-capture-cache.service';
import { LiveCaptureService } from '../services/live-capture.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MatchReviewStore } from './store/match-review.store';
import { PostMatchHeaderComponent } from './components/post-match-header/post-match-header.component';
import { PostMatchKpiStripComponent } from './components/post-match-kpi-strip/post-match-kpi-strip.component';
import { PostMatchTimelineComponent } from './components/post-match-timeline/post-match-timeline.component';
import { PostMatchTableComponent } from './components/post-match-table/post-match-table.component';
import { PostMatchPanelComponent } from './components/post-match-panel/post-match-panel.component';
import { PostMatchCreateModalComponent } from './components/post-match-create-modal/post-match-create-modal.component';

@Component({
  selector: 'app-post-match',
  standalone: true,
  imports: [
    CommonModule,
    PostMatchHeaderComponent,
    PostMatchKpiStripComponent,
    PostMatchTimelineComponent,
    PostMatchTableComponent,
    PostMatchPanelComponent,
    PostMatchCreateModalComponent
  ],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.css'
})
export class PostMatchComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly eventService = inject(EventService);
  private readonly eventTypeService = inject(EventTypeService);
  private readonly rosterService = inject(RosterService);
  private readonly cacheService = inject(LiveCaptureCacheService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly toastService = inject(ToastService);
  private readonly layoutService = inject(LayoutService);
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
  readonly showCreateModal = signal<boolean>(false);

  goToStatistics(): void {
    this.router.navigate(['/post-match', this.matchId, 'statistics']);
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isEditingField = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA');

    if (event.key === 'Escape') {
      if (this.showCreateModal()) {
        this.closeCreateModal();
        return;
      }
      if (this.panel?.sheetState() === 'open') {
        this.panel.closeSheet();
        return;
      }
      if (this.store.selectedEventId()) {
        this.store.selectEvent(null);
        return;
      }
    }

    if (!isEditingField) {
      // 1. Atajos de Triage dedicados (saltar entre pendientes sin importar qué está visible)
      if (event.key === ']' || (event.shiftKey && event.key === 'ArrowRight')) {
        event.preventDefault();
        this.store.selectNextPending();
        return;
      }
      if (event.key === '[' || (event.shiftKey && event.key === 'ArrowLeft')) {
        event.preventDefault();
        this.store.selectPrevPending();
        return;
      }

      // 2. Navegación fluida por Eventos Visibles (siguiente / anterior en orden cronológico)
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.store.selectNextVisible();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.store.selectPrevVisible();
        return;
      }
    }
  }

  ngOnInit(): void {
    this.layoutService.setWide(true);
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    if (this.matchId) {
      this.store.setMatchId(this.matchId);
      this.loadMatchDetails();
      this.loadRoster();
      this.loadEventTypesAndEvents();
    }
  }

  ngOnDestroy(): void {
    this.layoutService.setWide(null);
  }

  loadRoster(): void {
    this.rosterService.getMatchRosterPlayers(this.matchId).subscribe({
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
        this.applyMatchDetails(match);
      },
      error: async () => {
        try {
          const cached = await this.cacheService.getMatch(this.matchId);
          if (cached) {
            this.applyMatchDetails(cached);
            return;
          }
        } catch {
          // Fallback falló
        }
        this.toastService.error('No se pudieron obtener los detalles del partido');
      }
    });
  }

  private applyMatchDetails(match: { opponent?: string | null; startedAt?: string | null; homeScore?: number; awayScore?: number }): void {
    this.opponent.set(match.opponent || 'Visitante');
    if (match.startedAt) {
      this.store.matchStartTime.set(match.startedAt);
    }
    this.store.setInitialScores(match.homeScore ?? 0, match.awayScore ?? 0);
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
          absoluteMatchTime: e.absoluteMatchTime ?? null,
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
