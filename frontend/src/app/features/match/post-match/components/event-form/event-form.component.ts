import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { Possession } from '../../../types/live-capture.types';

export interface EventFormData {
  eventTypeId: string;
  teamPossession: Possession;
  playerId: string | null;
  period?: 1 | 2;
  minute?: number | null;
  second?: number | null;
  // Campos preparados para enriquecimiento táctico y notas (HU compañero)
  notes?: string | null;
  infractionCause?: string | null;
  scrumPushMeters?: number | null;
}

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.css'
})
export class EventFormComponent {
  readonly store = inject(MatchReviewStore);

  @Input() set initialData(data: EventFormData | null) {
    if (data) {
      this.eventTypeId.set(data.eventTypeId || '');
      this.teamPossession.set(data.teamPossession || 'OWN');
      this.playerId.set(data.playerId || null);
      if (data.period !== undefined) this.period.set(data.period);
      if (data.minute !== undefined) this.minute.set(data.minute);
      if (data.second !== undefined) this.second.set(data.second);
      this.notes.set(data.notes || '');
      this.infractionCause.set(data.infractionCause || '');
      this.scrumPushMeters.set(data.scrumPushMeters ?? null);
    }
  }

  @Input() showTimeFields = false;
  @Input() showEnrichmentFields = false;
  @Input() disabled = false;

  @Output() formChange = new EventEmitter<EventFormData>();

  readonly eventTypeId = signal<string>('');
  readonly teamPossession = signal<Possession>('OWN');
  readonly playerId = signal<string | null>(null);
  readonly period = signal<1 | 2>(1);
  readonly minute = signal<number | null>(1);
  readonly second = signal<number | null>(0);

  // Señales de Enriquecimiento Táctico
  readonly notes = signal<string>('');
  readonly infractionCause = signal<string>('');
  readonly scrumPushMeters = signal<number | null>(null);

  readonly currentEventType = computed(() =>
    this.store.eventTypesList().find(t => t.id === this.eventTypeId())
  );

  readonly isDisciplinaryOrPenalty = computed(() => {
    const name = (this.currentEventType()?.name || '').toLowerCase();
    return name.includes('penal') || 
           name.includes('infracción') || 
           name.includes('infraccion') ||
           name.includes('amarilla') || 
           name.includes('roja') || 
           name.includes('tarjeta') || 
           name.includes('amonestación') || 
           name.includes('amonestacion') || 
           name.includes('expulsión') ||
           name.includes('expulsion');
  });

  readonly isScrum = computed(() => {
    const name = (this.currentEventType()?.name || '').toLowerCase();
    return name.includes('scrum');
  });

  private emitChange(): void {
    this.formChange.emit({
      eventTypeId: this.eventTypeId(),
      teamPossession: this.teamPossession(),
      playerId: this.playerId(),
      period: this.period(),
      minute: this.minute(),
      second: this.second(),
      notes: this.notes().trim() || null,
      infractionCause: this.infractionCause().trim() || null,
      scrumPushMeters: this.scrumPushMeters()
    });
  }

  onNotesChange(n: string): void {
    this.notes.set(n);
    this.emitChange();
  }

  onInfractionCauseChange(cause: string): void {
    this.infractionCause.set(cause);
    this.emitChange();
  }

  onScrumPushMetersChange(meters: number | null): void {
    this.scrumPushMeters.set(meters);
    this.emitChange();
  }

  onEventTypeChange(id: string): void {
    this.eventTypeId.set(id);
    this.emitChange();
  }

  onPossessionChange(pos: Possession): void {
    this.teamPossession.set(pos);
    if (pos === 'OPPONENT') {
      this.playerId.set(null);
    }
    this.emitChange();
  }

  onPlayerChange(id: string): void {
    const finalId = id.trim() || null;
    this.playerId.set(finalId);
    this.emitChange();
  }

  onPeriodChange(p: 1 | 2): void {
    this.period.set(p);
    this.emitChange();
  }

  onMinuteChange(m: number | null): void {
    this.minute.set(m);
    this.emitChange();
  }

  onSecondChange(s: number | null): void {
    this.second.set(s);
    this.emitChange();
  }

  get formattedDisplayTime(): string {
    const min = Math.max(0, Math.floor(this.minute() ?? 0));
    const sec = Math.max(0, Math.min(59, Math.floor(this.second() ?? 0)));
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  get formattedMatchTotalTime(): string {
    const min = Math.max(0, Math.floor(this.minute() ?? 0));
    const sec = Math.max(0, Math.min(59, Math.floor(this.second() ?? 0)));
    const totalMin = this.period() === 2 ? (min < 40 ? 40 + min : min) : min;
    return `${totalMin.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}
