import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchReviewStore } from '../../store/match-review.store';
import { Possession } from '../../../types/live-capture.types';

import { TemplateField } from '../../../types/event-type.types';
import { EventPrefillHints } from '../../utils/event-prefill';

export interface EventFormData {
  eventTypeId: string;
  teamPossession: Possession;
  playerId: string | null;
  period?: 1 | 2;
  minute?: number | null;
  second?: number | null;
  attributes?: Record<string, unknown> | null;
  isValid?: boolean;
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
      this.attributes.set(data.attributes ? { ...data.attributes } : {});
    }
  }

  /** Etiquetas de origen de los valores precargados; se ocultan apenas el usuario edita ese campo. */
  @Input() set prefillHints(hints: EventPrefillHints | null) {
    this.periodHint.set(hints?.period ?? null);
    this.timeHint.set(hints?.time ?? null);
  }

  readonly periodHint = signal<string | null>(null);
  readonly timeHint = signal<string | null>(null);

  @Input() showTimeFields = false;
  @Input() showEnrichmentSlot = false;
  @Input() disabled = false;

  @Output() formChange = new EventEmitter<EventFormData>();

  readonly eventTypeId = signal<string>('');
  readonly teamPossession = signal<Possession>('OWN');
  readonly playerId = signal<string | null>(null);
  readonly period = signal<1 | 2>(1);
  readonly minute = signal<number | null>(1);
  readonly second = signal<number | null>(0);
  readonly attributes = signal<Record<string, unknown>>({});

  readonly currentTemplateFields = computed<TemplateField[]>(() => {
    const typeId = this.eventTypeId();
    if (!typeId) return [];
    const type = this.store.eventTypesList().find(t => t.id === typeId);
    return type?.templateEventFields || [];
  });

  private emitChange(): void {
    const rawAttrs = this.attributes();
    const cleanAttrs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawAttrs)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanAttrs[k] = v;
      }
    }

    const isValid = !this.hasAnyInvalidField();

    this.formChange.emit({
      eventTypeId: this.eventTypeId(),
      teamPossession: this.teamPossession(),
      playerId: this.playerId(),
      period: this.period(),
      minute: this.minute(),
      second: this.second(),
      attributes: Object.keys(cleanAttrs).length > 0 ? cleanAttrs : null,
      isValid
    });
  }

  isFieldInvalid(field: TemplateField): boolean {
    const val = this.getAttributeValue(field.key);
    if (val === null || val === undefined || val === '') {
      return false;
    }
    const num = Number(val);
    if (isNaN(num)) {
      return true;
    }
    if (field.min != null && num < field.min) {
      return true;
    }
    if (field.max != null && num > field.max) {
      return true;
    }
    return false;
  }

  getNumberPlaceholder(field: TemplateField): string {
    if (field.min != null && field.max != null) {
      return `Entre ${field.min} y ${field.max}`;
    }
    if (field.min != null) {
      return `Mínimo ${field.min}`;
    }
    if (field.max != null) {
      return `Máximo ${field.max}`;
    }
    return 'Ingresar valor numérico...';
  }

  getFieldValidationMessage(field: TemplateField): string {
    if (field.min != null && field.max != null) {
      return `Inserte un valor entre ${field.min} y ${field.max}`;
    }
    if (field.min != null) {
      return `Inserte un valor mayor o igual a ${field.min}`;
    }
    if (field.max != null) {
      return `Inserte un valor menor o igual a ${field.max}`;
    }
    return 'Valor numérico fuera de rango';
  }

  hasAnyInvalidField(): boolean {
    const fields = this.currentTemplateFields();
    for (const field of fields) {
      if (field.type === 'number' && this.isFieldInvalid(field)) {
        return true;
      }
    }
    return false;
  }

  onEventTypeChange(id: string): void {
    const changed = this.eventTypeId() !== id;
    this.eventTypeId.set(id);
    if (changed) {
      this.attributes.set({});
    }
    this.emitChange();
  }

  onAttributeChange(key: string, value: unknown): void {
    const current = { ...this.attributes() };
    if (value === null || value === undefined || value === '') {
      delete current[key];
    } else {
      current[key] = value;
    }
    this.attributes.set(current);
    this.emitChange();
  }

  onNumericAttributeChange(key: string, rawVal: number | string | null): void {
    if (rawVal === null || rawVal === '' || rawVal === undefined || isNaN(Number(rawVal))) {
      this.onAttributeChange(key, null);
    } else {
      this.onAttributeChange(key, Number(rawVal));
    }
  }

  getAttributeValue(key: string): unknown {
    return this.attributes()[key] ?? null;
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
    this.periodHint.set(null);
    this.period.set(p);
    this.emitChange();
  }

  onMinuteChange(m: number | null): void {
    this.timeHint.set(null);
    this.minute.set(m);
    this.emitChange();
  }

  onSecondChange(s: number | null): void {
    this.timeHint.set(null);
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
