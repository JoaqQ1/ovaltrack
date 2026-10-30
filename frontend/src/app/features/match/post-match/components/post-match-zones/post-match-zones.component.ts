import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { MatchService } from '../../../services/match.service';
import { ZoneAssignmentResponse, ZoneCellRef } from '../../../types/zone.types';
import { MatchZonesStore } from '../../store/match-zones.store';
import { describeZone, zoneLabel } from '../../utils/zone-grid';
import { ZonePeriodFilter, countByCell, coveragePercent, eventsInCell, unzonedEvents } from '../../utils/zone-stats';
import { RugbyFieldComponent, RugbyFieldMode } from '../rugby-field/rugby-field.component';
import { ZoneAssignmentPanelComponent } from '../zone-assignment-panel/zone-assignment-panel.component';
import { ZoneEventsListComponent } from '../zone-events-list/zone-events-list.component';
import { ZoneGapSelection, ZoneTimelineComponent } from '../zone-timeline/zone-timeline.component';

/**
 * Pantalla de zonas: arma el layout, carga los datos y conecta cancha, línea de tiempo, formulario y eventos.
 * Dos modos explícitos: "Asignar zona" (edita tramos) y "Ver eventos" (solo lectura).
 */
@Component({
  selector: 'app-post-match-zones',
  standalone: true,
  imports: [CommonModule, RugbyFieldComponent, ZoneAssignmentPanelComponent, ZoneTimelineComponent, ZoneEventsListComponent],
  templateUrl: './post-match-zones.component.html',
  styleUrl: './post-match-zones.component.css'
})
export class PostMatchZonesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly matchService = inject(MatchService);
  private readonly userContext = inject(UserContextService);
  private readonly destroyRef = inject(DestroyRef);
  readonly zonesStore = inject(MatchZonesStore);

  private readonly panel = viewChild(ZoneAssignmentPanelComponent);

  readonly matchId = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly opponent = signal<string>('Rival');
  readonly score = signal<{ home: number; away: number } | null>(null);
  readonly ownClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  // Estados separados: la zona del formulario y la zona que se está inspeccionando no se pisan.
  readonly mode = signal<RugbyFieldMode>('assign');
  readonly periodFilter = signal<ZonePeriodFilter>('ALL');
  readonly selectedCell = signal<ZoneCellRef | null>(null);
  readonly viewCell = signal<ZoneCellRef | null>(null);
  readonly showUnzoned = signal<boolean>(false);

  readonly periodOptions: { value: ZonePeriodFilter; label: string }[] = [
    { value: 'ALL', label: 'Todo' }, { value: 1, label: '1T' }, { value: 2, label: '2T' }
  ];

  // Todo se deriva de los eventos que ya traen su zona: una sola fuente de verdad.
  readonly cellCounts = computed(() => countByCell(this.zonesStore.events(), this.periodFilter()));
  readonly unzonedCount = computed(() => unzonedEvents(this.zonesStore.events(), this.periodFilter()).length);
  readonly coverage = computed(() => coveragePercent(this.zonesStore.assignments(), this.periodFilter()));
  readonly fieldSelectedCell = computed(() => this.mode() === 'assign' ? this.selectedCell() : this.viewCell());

  readonly listedEvents = computed(() => {
    const events = this.zonesStore.events();
    const filter = this.periodFilter();
    if (this.showUnzoned()) return unzonedEvents(events, filter);
    const cell = this.viewCell();
    return cell ? eventsInCell(events, cell, filter) : [];
  });

  readonly listTitle = computed(() => {
    const cell = this.viewCell();
    if (this.showUnzoned()) return 'Eventos sin zona';
    return cell ? `Eventos en ${zoneLabel(cell)}` : 'Eventos por zona';
  });

  readonly listSubtitle = computed(() => {
    const cell = this.viewCell();
    return !this.showUnzoned() && cell ? describeZone(cell) : '';
  });

  readonly listHint = computed(() =>
    this.showUnzoned() || this.viewCell() ? null : 'Tocá una zona de la cancha para ver sus eventos.');

  ngOnInit(): void {
    this.layoutService.setWide(true);
    this.zonesStore.reset();

    const id = this.route.snapshot.paramMap.get('id') || '';
    this.matchId.set(id);
    if (!id) {
      this.errorMessage.set('No se indicó el partido.');
      this.isLoading.set(false);
      return;
    }
    this.load(id);
  }

  ngOnDestroy(): void {
    this.layoutService.setWide(null);
    this.zonesStore.reset();
  }

  goBack(): void {
    this.router.navigate(['/post-match', this.matchId()]);
  }

  setMode(mode: RugbyFieldMode): void {
    this.mode.set(mode);
    if (mode === 'assign') this.showUnzoned.set(false);
  }

  setPeriodFilter(filter: ZonePeriodFilter): void {
    this.periodFilter.set(filter);
  }

  onCellSelected(cell: ZoneCellRef): void {
    if (this.mode() === 'assign') {
      this.selectedCell.set(cell);
      return;
    }
    this.viewCell.set(cell);
    this.showUnzoned.set(false);
  }

  /** El chip "Sin zona" lleva a la lista de esos eventos (modo lectura). */
  showUnzonedEvents(): void {
    this.mode.set('view');
    this.viewCell.set(null);
    this.showUnzoned.set(true);
  }

  /** Tocar un tramo de la línea de tiempo lo carga para editar. */
  onSegmentSelected(assignment: ZoneAssignmentResponse): void {
    this.panel()?.startEdit(assignment);
  }

  /** Tocar un hueco precarga el formulario con ese rango. */
  onGapSelected(gap: ZoneGapSelection): void {
    this.panel()?.prefill(gap);
  }

  private load(matchId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({ match: this.matchService.getMatchById(matchId), data: this.zonesStore.load(matchId) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ match }) => {
          this.opponent.set(match.opponent || 'Rival');
          this.score.set({ home: match.homeScore ?? 0, away: match.awayScore ?? 0 });
          this.isLoading.set(false);
        },
        error: err => {
          const message = err?.error?.message;
          this.errorMessage.set(typeof message === 'string' && message ? message : 'No se pudieron cargar las zonas del partido.');
          this.isLoading.set(false);
        }
      });
  }
}
