import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { EventService } from '../../../services/event.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Possession } from '../../../types/live-capture.types';
import { BackendEventCreationRequest, MatchTimelineEventResponse } from '../../../types/event.types';

@Component({
  selector: 'app-post-match-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  onPossessionChange(): void {
    if (this.possession === 'OPPONENT') {
      this.playerId = '';
    }
  }

  onClose(): void {
    if (this.isSubmitting()) return;
    this.close.emit();
  }

  save(): void {
    if (!this.eventTypeId) {
      this.toastService.warning('Debes seleccionar un tipo de evento');
      return;
    }

    if (this.minute === null || this.minute === undefined || this.minute < 0) {
      this.toastService.warning('Ingresa un minuto válido');
      return;
    }

    const secVal = this.second ?? 0;
    if (secVal < 0 || secVal > 59) {
      this.toastService.warning('Los segundos deben estar entre 0 y 59');
      return;
    }

    const seconds = Math.floor(this.minute) * 60 + Math.floor(secVal);
    const assignedPlayerId = (this.possession === 'OPPONENT') ? null : (this.playerId.trim() || null);
    const absoluteSeconds = this.store.estimateAbsoluteTime(seconds, this.period);

    const payload: BackendEventCreationRequest = {
      eventTypeId: this.eventTypeId,
      matchId: this.matchId,
      period: this.period,
      matchTime: seconds,
      absoluteMatchTime: absoluteSeconds,
      teamPossession: this.possession,
      playerId: assignedPlayerId,
      origin: 'post_capture',
      realTime: new Date().toISOString()
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
          matchTime: seconds,
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
  }
}
