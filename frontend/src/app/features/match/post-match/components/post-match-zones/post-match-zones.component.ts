import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LayoutService } from 'src/app/core/services/layout.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ZONE_HALF_MINUTES, ZoneAssignmentResponse, ZoneCellRef } from '../../../types/zone.types';
import { MatchZonesStore } from '../../store/match-zones.store';
import { PostMatchShellStore } from '../../store/post-match-shell.store';
import { describeZone, zoneLabel } from '../../utils/zone-grid';
import { ZONE_SHORTCUT_HELP, isSaveShortcut, isTypingTarget, shortcutCell } from '../../utils/zone-shortcuts';
import {
  NO_ZONE_EVENT_FILTERS, ZoneEventFilters, ZonePeriodFilter, countByCell, coverageMinutes, eventsInCell, filterEvents, unzonedEvents, zoneCoveragePercent
} from '../../utils/zone-stats';
import { Possession } from '../../../types/live-capture.types';
import { RugbyFieldComponent, RugbyFieldMode } from '../rugby-field/rugby-field.component';
import { ZoneAssignmentPanelComponent } from '../zone-assignment-panel/zone-assignment-panel.component';
import { ZoneEventsListComponent } from '../zone-events-list/zone-events-list.component';
import { ZoneKpiStripComponent } from '../zone-kpi-strip/zone-kpi-strip.component';
import { TerritoryGapSelection, ZoneTerritoryGridComponent } from '../zone-territory-grid/zone-territory-grid.component';

/** Lateral que se propone al tocar una fila de la grilla: el centro de la cancha. */
const DEFAULT_LATERAL_ROW = 2;

/**
 * Pantalla de zonas: arma el layout, carga los datos y conecta cancha, línea de tiempo, formulario y eventos.
 * Dos modos explícitos: "Asignar zona" (edita tramos) y "Ver eventos" (solo lectura).
 */
@Component({
  selector: 'app-post-match-zones',
  standalone: true,
  imports: [CommonModule, RugbyFieldComponent, ZoneAssignmentPanelComponent, ZoneTerritoryGridComponent, ZoneEventsListComponent, ZoneKpiStripComponent],
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

  // Estados separados: la zona del formulario y la zona que se está inspeccionando no se pisan.
  readonly mode = signal<RugbyFieldMode>('assign');
  readonly periodFilter = signal<ZonePeriodFilter>('ALL');
  readonly selectedCell = signal<ZoneCellRef | null>(null);
  readonly viewCell = signal<ZoneCellRef | null>(null);
  readonly showUnzoned = signal<boolean>(false);

  readonly periodOptions: { value: ZonePeriodFilter; label: string }[] = [
    { value: 'ALL', label: 'Todo el partido' }, { value: 1, label: '1T' }, { value: 2, label: '2T' }
  ];

  readonly shortcutsOpen = signal<boolean>(false);
  readonly shortcutHelp = ZONE_SHORTCUT_HELP;

  readonly heatOn = signal<boolean>(true);
  readonly typeFilter = signal<string>('ALL');
  readonly possessionFilter = signal<Possession | 'ALL'>('ALL');

  readonly possessionOptions: { value: Possession | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' }, { value: 'OWN', label: 'Propios' }, { value: 'OPPONENT', label: 'Rival' }
  ];

  /** Tipos de evento presentes en el partido, para el filtro de "Ver eventos". */
  readonly eventTypeOptions = computed(() => {
    const byId = new Map(this.zonesStore.events().map(event => [event.eventTypeId, event.eventTypeName]));
    return [...byId.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });

  /** La posesión rige siempre; el filtro de tipo solo en "Ver eventos" (al asignar zonas se ven todos los tipos). */
  private readonly activeFilters = computed<ZoneEventFilters>(() => ({
    eventTypeId: this.mode() === 'view' ? this.typeFilter() : NO_ZONE_EVENT_FILTERS.eventTypeId,
    possession: this.possessionFilter()
  }));

  readonly filteredEvents = computed(() => filterEvents(this.zonesStore.events(), this.activeFilters()));

  // Todo se deriva de los eventos que ya traen su zona: una sola fuente de verdad.
  readonly cellCounts = computed(() => countByCell(this.filteredEvents(), this.periodFilter()));
  readonly unzonedCount = computed(() => unzonedEvents(this.filteredEvents(), this.periodFilter()).length);
  readonly coverageFirstHalf = computed(() => coverageMinutes(this.zonesStore.assignments(), 1));
  readonly coverageSecondHalf = computed(() => coverageMinutes(this.zonesStore.assignments(), 2));
  readonly halfMinutes = ZONE_HALF_MINUTES;

  // Indicadores del partido completo: no dependen de los filtros de la pantalla.
  readonly totalEvents = computed(() => this.zonesStore.events().length);
  readonly totalUnzoned = computed(() => unzonedEvents(this.zonesStore.events(), 'ALL').length);
  readonly coveragePercent = computed(() => zoneCoveragePercent(this.zonesStore.assignments()));
  readonly fieldSelectedCell = computed(() => this.mode() === 'assign' ? this.selectedCell() : this.viewCell());

  /** Tramos que se destacan en la grilla: los de la celda bajo el cursor o, en "Ver eventos", los de la celda elegida. */
  readonly highlightedCell = computed(() => this.zonesStore.hoverCell() ?? (this.mode() === 'view' ? this.viewCell() : null));

  /** Celda del tramo bajo el cursor en la timeline o la lista. */
  readonly linkedCell = computed<ZoneCellRef | null>(() => {
    const id = this.zonesStore.hoverSegmentId();
    const segment = id ? this.zonesStore.assignments().find(a => a.id === id) : undefined;
    return segment ? { row: segment.row, col: segment.col } : null;
  });

  /** Sin ningún tramo y sin zona elegida: la cancha invita a empezar por el minuto 0. */
  readonly showStartHint = computed(() =>
    this.mode() === 'assign' && this.zonesStore.assignments().length === 0 && !this.selectedCell());

  readonly listedEvents = computed(() => {
    const events = this.filteredEvents();
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

  toggleShortcuts(): void {
    this.shortcutsOpen.update(open => !open);
  }

  /**
   * Atajos de la página: las letras eligen la celda de la grilla (solo fuera de un campo de escritura) y
   * Ctrl/Cmd + Enter guarda el tramo, también escribiendo un minuto.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.isLoading() || this.errorMessage()) return;

    if (isSaveShortcut(event)) {
      if (this.mode() === 'assign') {
        event.preventDefault();
        this.panel()?.save();
      }
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;

    const cell = shortcutCell(event.key);
    if (cell) this.onCellSelected(cell);
  }

  goBack(): void {
    this.router.navigate(['/post-match', this.matchId()]);
  }

  setMode(mode: RugbyFieldMode): void {
    this.mode.set(mode);
    if (mode === 'assign') this.showUnzoned.set(false);
  }

  setHeat(on: boolean): void {
    this.heatOn.set(on);
  }

  onTypeFilterChange(event: Event): void {
    this.typeFilter.set((event.target as HTMLSelectElement).value);
  }

  setPossessionFilter(value: Possession | 'ALL'): void {
    this.possessionFilter.set(value);
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
