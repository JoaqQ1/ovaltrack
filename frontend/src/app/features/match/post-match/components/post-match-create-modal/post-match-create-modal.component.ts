import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Possession } from '../../../types/live-capture.types';
import { BackendEventCreationRequest, MatchTimelineEventResponse } from '../../../types/event.types';
import { EventFormComponent, EventFormData } from '../event-form/event-form.component';

@Component({
  selector: 'app-post-match-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, EventFormComponent],
  templateUrl: './post-match-create-modal.component.html',
  styleUrl: './post-match-create-modal.component.css'
})
export class PostMatchCreateModalComponent {
  readonly store = inject(MatchReviewStore);
  private readonly eventService = inject(EventService);
  private readonly toastService = inject(ToastService);

  @Input() isOpen = false;
  @Input() matchId = '';

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<MatchTimelineEventResponse>();

  readonly isSubmitting = signal<boolean>(false);

  // Form State
  eventTypeId = '';
  period: 1 | 2 = 1;
  minute: number | null = 1;
  second: number | null = 0;
  possession: Possession = 'OWN';
  playerId = '';
  attributes: Record<string, unknown> | null = null;

  onFormChange(data: EventFormData): void {
    this.eventTypeId = data.eventTypeId;
    this.possession = data.teamPossession;
    this.playerId = data.playerId || '';
    if (data.period !== undefined) this.period = data.period;
    if (data.minute !== undefined) this.minute = data.minute;
    if (data.second !== undefined) this.second = data.second;
    this.attributes = data.attributes ?? null;
  }

  onPossessionChange(): void {
    if (this.possession === 'OPPONENT') {
      this.playerId = '';
    }
  }

  onClose(): void {
    if (this.isSubmitting()) return;
    this.close.emit();
  }

  get formattedDisplayTime(): string {
    const min = Math.max(0, Math.floor(this.minute ?? 0));
    const sec = Math.max(0, Math.min(59, Math.floor(this.second ?? 0)));
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  get formattedMatchTotalTime(): string {
    const min = Math.max(0, Math.floor(this.minute ?? 0));
    const sec = Math.max(0, Math.min(59, Math.floor(this.second ?? 0)));
    const totalMin = this.period === 2 ? (min < 40 ? 40 + min : min) : min;
    return `${totalMin.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  save(): void {
    if (!this.eventTypeId) {
      this.toastService.warning('Debés seleccionar un tipo de evento');
      return;
    }

    if (this.minute === null || this.minute === undefined || this.minute < 0) {
      this.toastService.warning('Ingresá un minuto válido');
      return;
    }

    if (this.period === 1 && this.minute > 40) {
      this.toastService.warning(
        `El 1° Tiempo no puede superar los 40 minutos. Si el evento ocurrió en el minuto ${this.minute} del partido, seleccioná el 2° Tiempo.`
      );
      return;
    }

    if (this.period === 2 && this.minute > 80) {
      this.toastService.warning('El 2° Tiempo no puede superar los 80 minutos de partido.');
      return;
    }

    const secVal = this.second ?? 0;
    if (secVal < 0 || secVal > 59) {
      this.toastService.warning('Los segundos deben estar entre 0 y 59');
      return;
    }

    let matchTimeSeconds = Math.floor(this.minute) * 60 + Math.floor(secVal);
    if (this.period === 2 && this.minute < 40) {
      matchTimeSeconds = 2400 + matchTimeSeconds;
    }

    const assignedPlayerId = (this.possession === 'OPPONENT') ? null : (this.playerId.trim() || null);
    const absoluteSeconds = this.store.estimateAbsoluteTime(matchTimeSeconds, this.period);

    const payload: BackendEventCreationRequest = {
      eventTypeId: this.eventTypeId,
      matchId: this.matchId,
      period: this.period,
      matchTime: matchTimeSeconds,
      absoluteMatchTime: absoluteSeconds,
      teamPossession: this.possession,
      playerId: assignedPlayerId,
      origin: 'post_capture',
      realTime: new Date().toISOString(),
      attributes: this.attributes ?? undefined
    };

    this.isSubmitting.set(true);

    this.eventService.create(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);

        const dict = this.store.eventTypesDict();
        const eventTypeName = dict[this.eventTypeId] || 'Evento';
        const playerObj = assignedPlayerId
          ? this.store.availablePlayers().find(p => p.id === assignedPlayerId)
          : null;

        const timelineEvent: MatchTimelineEventResponse = {
          id: res.id,
          eventTypeId: this.eventTypeId,
          eventTypeName,
          playerId: assignedPlayerId,
          playerName: playerObj ? playerObj.fullName : null,
          playerJerseyNumber: playerObj ? playerObj.jerseyNumber : null,
          matchTime: matchTimeSeconds,
          absoluteMatchTime: res.absoluteMatchTime ?? absoluteSeconds,
          period: this.period,
          teamPossession: this.possession,
          origin: 'post_capture',
          attributes: res.attributes || undefined
        };

        this.store.addEvent(timelineEvent);
        this.toastService.success('Evento agregado correctamente');
        this.created.emit(timelineEvent);
        this.resetForm();
        this.close.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || err?.error || 'Error al agregar el evento post-partido';
        this.toastService.error(typeof msg === 'string' ? msg : 'Error al guardar el evento');
      }
    });
  }

  private resetForm(): void {
    this.eventTypeId = '';
    this.period = 1;
    this.minute = 1;
    this.second = 0;
    this.possession = 'OWN';
    this.playerId = '';
    this.attributes = null;
  }
}
