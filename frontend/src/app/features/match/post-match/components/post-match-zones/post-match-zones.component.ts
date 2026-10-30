import { Component, DestroyRef, HostListener, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ZoneAssignmentResponse, ZoneCellRef } from '../../../types/zone.types';
import { MatchZonesStore } from '../../store/match-zones.store';
import { PostMatchShellStore } from '../../store/post-match-shell.store';
import { ZONE_SHORTCUT_HELP, isSaveShortcut, isTypingTarget, shortcutCell } from '../../utils/zone-shortcuts';
import {
  NO_ZONE_EVENT_FILTERS, ZonePeriodFilter, countByCell, filterEvents, unzonedEvents, zoneCoveragePercent
} from '../../utils/zone-stats';
import { Possession } from '../../../types/live-capture.types';
import { RugbyFieldComponent } from '../rugby-field/rugby-field.component';
import { ZoneAssignmentPanelComponent } from '../zone-assignment-panel/zone-assignment-panel.component';
import { ZoneKpiStripComponent } from '../zone-kpi-strip/zone-kpi-strip.component';
import { TerritoryGapSelection, ZoneTerritoryGridComponent } from '../zone-territory-grid/zone-territory-grid.component';

/** Lateral que se propone al tocar una fila de la grilla: el centro de la cancha. */
const DEFAULT_LATERAL_ROW = 2;

/**
 * Pantalla de zonas: arma el layout, carga los datos y conecta KPI, filtros, grilla de territorio, cancha y formulario.
 * La grilla y la cancha eligen la franja (y la cancha también el lateral); el formulario guarda el tramo.
 */
@Component({
  selector: 'app-post-match-zones',
  standalone: true,
  imports: [RugbyFieldComponent, ZoneAssignmentPanelComponent, ZoneTerritoryGridComponent, ZoneKpiStripComponent],
  templateUrl: './post-match-zones.component.html',
  styleUrl: './post-match-zones.component.css'
})
export class PostMatchZonesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly shell = inject(PostMatchShellStore);
  private readonly userContext = inject(UserContextService);
  private readonly destroyRef = inject(DestroyRef);
  readonly zonesStore = inject(MatchZonesStore);

  private readonly panel = viewChild(ZoneAssignmentPanelComponent);

  readonly matchId = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly opponent = computed(() => this.shell.match()?.opponent || 'Rival');
  readonly ownClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  /** Zona elegida en la grilla o la cancha: la usa el formulario. */
  readonly selectedCell = signal<ZoneCellRef | null>(null);
  readonly periodFilter = signal<ZonePeriodFilter>('ALL');
  readonly possessionFilter = signal<Possession | 'ALL'>('ALL');

  readonly periodOptions: { value: ZonePeriodFilter; label: string }[] = [
    { value: 'ALL', label: 'Todo el partido' }, { value: 1, label: '1T' }, { value: 2, label: '2T' }
  ];

  readonly possessionOptions: { value: Possession | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' }, { value: 'OWN', label: 'Propios' }, { value: 'OPPONENT', label: 'Rival' }
  ];

  readonly helpOpen = signal<boolean>(false);
  readonly shortcutHelp = ZONE_SHORTCUT_HELP;

  /** Eventos según la posesión elegida; el tiempo lo aplican por separado la cancha y la grilla. */
  readonly filteredEvents = computed(() =>
    filterEvents(this.zonesStore.events(), { ...NO_ZONE_EVENT_FILTERS, possession: this.possessionFilter() }));

  // Todo se deriva de los eventos que ya traen su zona: una sola fuente de verdad.
  readonly cellCounts = computed(() => countByCell(this.filteredEvents(), this.periodFilter()));

  // Indicadores del partido completo: no dependen de los filtros de la pantalla.
  readonly totalEvents = computed(() => this.zonesStore.events().length);
  readonly totalUnzoned = computed(() => unzonedEvents(this.zonesStore.events(), 'ALL').length);
  readonly coveragePercent = computed(() => zoneCoveragePercent(this.zonesStore.assignments()));

  /** Celda de la cancha bajo el cursor: la grilla destaca sus tramos y atenúa el resto. */
  readonly highlightedCell = this.zonesStore.hoverCell;

  /** Celda del tramo bajo el cursor en la grilla. */
  readonly linkedCell = computed<ZoneCellRef | null>(() => {
    const id = this.zonesStore.hoverSegmentId();
    const segment = id ? this.zonesStore.assignments().find(a => a.id === id) : undefined;
    return segment ? { row: segment.row, col: segment.col } : null;
  });

  /** Sin ningún tramo y sin zona elegida: la cancha invita a empezar por el minuto 0. */
  readonly showStartHint = computed(() => this.zonesStore.assignments().length === 0 && !this.selectedCell());

  ngOnInit(): void {
    this.layoutService.setWide(true);
    this.zonesStore.reset();

    const id = this.shell.matchId();
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

  toggleHelp(): void {
    this.helpOpen.update(open => !open);
  }

  /**
   * Atajos de la página: las letras eligen la celda de la grilla (solo fuera de un campo de escritura) y
   * Ctrl/Cmd + Enter guarda el tramo, también escribiendo un minuto.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.isLoading() || this.errorMessage()) return;

    if (isSaveShortcut(event)) {
      event.preventDefault();
      this.panel()?.save();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;

    const cell = shortcutCell(event.key);
    if (cell) this.onCellSelected(cell);
  }

  goBack(): void {
    this.router.navigate(['/post-match', this.matchId()]);
  }

  setPossessionFilter(value: Possession | 'ALL'): void {
    this.possessionFilter.set(value);
  }

  setPeriodFilter(filter: ZonePeriodFilter): void {
    this.periodFilter.set(filter);
  }

  /** Tocar una zona de la cancha elige franja y lateral a la vez. */
  onCellSelected(cell: ZoneCellRef): void {
    this.selectedCell.set(cell);
  }

  /** Tocar un bloque de la grilla lo carga para editar. */
  onSegmentSelected(assignment: ZoneAssignmentResponse): void {
    this.panel()?.startEdit(assignment);
  }

  /** Tocar una fila dentro de un hueco precarga el rango y la franja; el lateral queda en Centro si no había uno. */
  onGapSelected(gap: TerritoryGapSelection): void {
    this.selectedCell.update(cell => ({ row: cell?.row ?? DEFAULT_LATERAL_ROW, col: gap.col }));
    this.panel()?.prefill(gap);
  }

  private load(matchId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.zonesStore.load(matchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.isLoading.set(false),
        error: err => {
          const message = err?.error?.message;
          this.errorMessage.set(typeof message === 'string' && message ? message : 'No se pudieron cargar las zonas del partido.');
          this.isLoading.set(false);
        }
      });
  }
}
