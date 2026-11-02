import { Component, ElementRef, ViewChild, computed, effect, inject, signal, untracked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { MatchReviewStore } from '../../store/match-review.store';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Possession } from '../../../types/live-capture.types';
import { MatchTimelineEventResponse } from '../../../types/event.types';
import { ReviewEventViewModel } from '../../types/match-review.types';
import { ModalComponent } from '../../../../modal/modal.component';
import { EventFormComponent, EventFormData } from '../event-form/event-form.component';
import { TemplateField } from '../../../types/event-type.types';
import { ZoneCellRef } from '../../../types/zone.types';
import { EventZoneLink, describeEventZone, resolveEventZoneLink } from '../../utils/zone-event-link';
import { zoneDeepLinkParams } from '../../utils/zone-deep-link';
import { zoneLabel } from '../../utils/zone-grid';
import { ZoneMiniMapComponent } from '../zone-mini-map/zone-mini-map.component';

@Component({
  selector: 'app-post-match-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ModalComponent, EventFormComponent, ZoneMiniMapComponent],
  templateUrl: './post-match-panel.component.html',
  styleUrl: './post-match-panel.component.css'
})
export class PostMatchPanelComponent implements OnDestroy {
  readonly store = inject(MatchReviewStore);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  // Solapas de Inspección: Ver o Editar
  readonly activeTab = signal<'view' | 'edit'>('view');

  // Estado del Autoguardado
  readonly saveStatus = signal<'saved' | 'saving' | 'error' | 'idle'>('idle');
  private readonly saveSubject = new Subject<{ id: string; payload: Partial<MatchTimelineEventResponse> }>();
  private saveTimer: any = null;

  // Estado del Bottom Sheet en Tablet/Mobile (< 1121px)
  readonly sheetState = signal<'peek' | 'open'>('peek');

  // Estados de Modales
  readonly showDeleteModal = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // Detalle de "Ver": si los atributos no entran, scrollea y un degradado avisa que hay más abajo
  readonly detailHasMore = signal<boolean>(false);
  private detailScrollEl: HTMLElement | null = null;
  private detailObserver?: ResizeObserver;

  @ViewChild('detailScroll')
  set detailScroll(ref: ElementRef<HTMLElement> | undefined) {
    const el = ref?.nativeElement ?? null;
    if (el === this.detailScrollEl) return;
    this.detailObserver?.disconnect();
    this.detailScrollEl = el;
    if (el && typeof ResizeObserver !== 'undefined') {
      // El contenedor cambia con el alto de la ventana; su contenido, con los atributos del evento
      this.detailObserver = new ResizeObserver(() => this.updateDetailOverflow());
      this.detailObserver.observe(el);
      if (el.firstElementChild) this.detailObserver.observe(el.firstElementChild);
    }
    // Se mide al terminar el ciclo de detección, con el DOM ya actualizado
    queueMicrotask(() => this.updateDetailOverflow());
  }

  constructor() {
    this.saveSubject.pipe(
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.saveStatus.set('saving')),
      switchMap(({ id, payload }) =>
        this.eventService.update(id, payload).pipe(
          tap(() => {
            this.store.updateEvent(id, payload);
            this.saveStatus.set('saved');
            if (this.saveTimer) {
              clearTimeout(this.saveTimer);
            }
            this.saveTimer = setTimeout(() => {
              this.saveStatus.set('idle');
            }, 2500);
          }),
          catchError(() => {
            this.saveStatus.set('error');
            this.toastService.error('Error al autoguardar la jugada');
            return of(null);
          })
        )
      ),
      takeUntilDestroyed()
    ).subscribe();

    // Cada evento nuevo se muestra desde el principio del detalle
    effect(() => {
      this.store.selectedEventId();
      untracked(() => queueMicrotask(() => {
        if (this.detailScrollEl) this.detailScrollEl.scrollTop = 0;
        this.updateDetailOverflow();
      }));
    });
  }

  updateDetailOverflow(): void {
    const el = this.detailScrollEl;
    this.detailHasMore.set(!!el && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  onFormChange(formData: EventFormData): void {
    if (formData.isValid === false) {
      return;
    }
    const ev = this.store.selectedEvent();
    if (!ev) return;
    this.saveStatus.set('saving');
    this.saveSubject.next({
      id: ev.id,
      payload: {
        eventTypeId: formData.eventTypeId,
        teamPossession: formData.teamPossession,
        playerId: formData.playerId,
        attributes: formData.attributes
      }
    });
  }

  readonly zoneLabel = zoneLabel;

  /**
   * A dónde lleva el evento en Zonas, calculado con los tramos cargados. Si no se pudieron cargar, no se ofrece hueco
   * ni tramo (el enlace va a Zonas sin parámetros). Null si el evento no tiene un tiempo válido: la fila no se muestra.
   */
  zoneLinkFor(ev: ReviewEventViewModel): EventZoneLink | null {
    const loaded = this.store.zonesStatus() === 'loaded';
    const link = resolveEventZoneLink(ev, loaded ? this.store.zoneAssignments() : []);
    return link && !loaded ? { ...link, segment: null, gap: null } : link;
  }

  zoneLinkParamsFor(link: EventZoneLink): Record<string, string> {
    return zoneDeepLinkParams(link);
  }

  zoneDescription(ev: ReviewEventViewModel, link: EventZoneLink): string {
    const zone: ZoneCellRef | null = ev.zone ?? null;
    return describeEventZone(zone, link);
  }

  getEnrichedAttributesDisplay(ev: ReviewEventViewModel): { label: string; value: string }[] {
    if (!ev.attributes || Object.keys(ev.attributes).length === 0) {
      return [];
    }

    const type = this.store.eventTypesList().find(t => t.id === ev.eventTypeId);
    const fields = type?.templateEventFields || [];
    const fieldsMap = new Map<string, TemplateField>();
    fields.forEach(f => fieldsMap.set(f.key, f));

    const result: { label: string; value: string }[] = [];

    for (const [key, val] of Object.entries(ev.attributes)) {
      if (val === null || val === undefined || val === '') continue;

      const field = fieldsMap.get(key);
      const label = field ? field.label : key;
      let displayVal = String(val);

      if (field) {
        if (field.type === 'select' && field.options) {
          const opt = field.options.find(o => o.value === val);
          if (opt) displayVal = opt.label;
        } else if (field.type === 'boolean') {
          displayVal = val === true ? (field.trueLabel || 'Sí') : (field.falseLabel || 'No');
        }
      }

      result.push({ label, value: displayVal });
    }

    return result;
  }

  readonly currentPendingIndex = computed<number | null>(() => {
    const selectedId = this.store.selectedEventId();
    if (!selectedId) return null;
    const queue = this.store.pendingQueue();
    const index = queue.findIndex(e => e.id === selectedId);
    return index >= 0 ? index + 1 : null;
  });

  toggleSheet(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.sheetState.update(s => s === 'peek' ? 'open' : 'peek');
  }

  openSheet(): void {
    this.sheetState.set('open');
  }

  closeSheet(): void {
    this.sheetState.set('peek');
  }

  onPrevPendingClick(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.store.selectPrevPending();
  }

  onNextPendingClick(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.store.selectNextPending();
  }

  openEditMode(): void {
    this.sheetState.set('open');
    this.activeTab.set('edit');
  }

  openEditModal(): void {
    this.openEditMode();
  }

  onEditModalFromPeek(event: MouseEvent): void {
    event.stopPropagation();
    this.openEditMode();
  }

  ngOnDestroy(): void {
    this.detailObserver?.disconnect();
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
  }

  // --- Asignación Rápida desde el Panel ---
  onQuickPlayerSelectChange(event: Event, ev: ReviewEventViewModel): void {
    const select = event.target as HTMLSelectElement;
    const playerId = select.value.trim() || null;
    if (!playerId) return;
    this.onQuickPlayerModelChange(playerId, ev);
  }

  onQuickPlayerModelChange(newPlayerId: string, ev: ReviewEventViewModel): void {
    const finalPlayerId = newPlayerId.trim() || null;
    this.isSubmitting.set(true);
    this.store.selectEvent(ev.id);
    this.saveStatus.set('saving');
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.eventService.update(ev.id, {
      playerId: finalPlayerId,
      teamPossession: ev.teamPossession
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.store.updateEvent(ev.id, { playerId: finalPlayerId });
        this.saveStatus.set('saved');
        this.saveTimer = setTimeout(() => {
          this.saveStatus.set('idle');
        }, 2500);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.saveStatus.set('error');
        this.saveTimer = setTimeout(() => {
          this.saveStatus.set('idle');
        }, 3000);
        this.toastService.error('Error al actualizar el jugador');
      }
    });
  }

  // --- Apertura y Manejo de Modal de Eliminación ---
  openDeleteModal(): void {
    if (!this.store.selectedEvent()) return;
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const ev = this.store.selectedEvent();
    if (!ev) return;

    this.isSubmitting.set(true);
    this.eventService.delete(ev.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.store.removeEvent(ev.id);
        this.closeDeleteModal();
        this.toastService.success('Evento eliminado correctamente');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Error al eliminar el evento');
      }
    });
  }
}
