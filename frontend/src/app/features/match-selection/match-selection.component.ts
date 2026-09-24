import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Match,
  MATCH_FILTERS,
  MATCH_STATUS_LABELS,
  MatchFilter,
  MatchStatus,
  NewMatchDraft,
} from '../cargaEnVivo/types/live-capture.types';
import { MatchService } from '../cargaEnVivo/services/live-capture.service';

/**
 * Pantalla de selección y alta de partidos.
 *
 * Muestra los partidos existentes agrupables por estado (no iniciado, en
 * progreso, finalizado) y permite crear uno nuevo con los dos únicos datos
 * necesarios en este punto del flujo: fecha y oponente. El resto de la
 * información del partido (formación, categoría, etc.) se asume que se
 * completa más adelante, en otra pantalla.
 *
 * Los datos y la lógica de persistencia viven en {@link MatchService}; este
 * componente solo mantiene el estado de UI (filtro activo, modal abierto,
 * formulario en curso) y reacciona a lo que el servicio devuelve.
 */
@Component({
  selector: 'ot-match-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-selection.component.html',
  styleUrl: './match-selection.component.css',
})
export class MatchSelectComponent implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly router = inject(Router);

  /** Filtros disponibles, en el orden en que se renderizan en el control segmentado. */
  readonly filters = MATCH_FILTERS;
  readonly statusLabels = MATCH_STATUS_LABELS;

  matches: Match[] = [];

  /** Filtro actualmente seleccionado en el control segmentado. */
  activeFilter: MatchFilter = 'all';

  /** Si el panel de alta de partido está abierto. */
  isCreateOpen = false;

  /** Datos del formulario de alta, en curso de carga. */
  draft: NewMatchDraft = { date: '', opponent: '' };
  errorMessage = '';

  /**
   * Se emite cuando el usuario toca un partido de la grilla. Quien use este
   * componente decide qué hacer según el estado (por ejemplo, navegar a la
   * pantalla de carga en vivo si está "en progreso" o "no iniciado", o a un
   * resumen si está "finalizado").
   */
  @Output() selectMatch = new EventEmitter<Match>();

  ngOnInit(): void {
    this.matchService.getMatches().subscribe({
      next: matches => this.matches = matches,
      error: () => this.errorMessage = 'No se pudieron cargar los partidos.',
    });
  }

  /** Partidos visibles según {@link activeFilter}. */
  get visibleMatches(): Match[] {
    if (this.activeFilter === 'all') {
      return this.matches;
    }

    return this.matches.filter(match => match.status === this.activeFilter);
  }

  /** Si el formulario de alta tiene los dos campos requeridos completos. */
  get canCreateMatch(): boolean {
    return this.draft.date.trim().length > 0 && this.draft.opponent.trim().length > 0;
  }

  setFilter(filter: MatchFilter): void {
    this.activeFilter = filter;
  }

  openCreateModal(): void {
    this.draft = { date: '', opponent: '' };
    this.isCreateOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateOpen = false;
  }

  /**
   * Confirma el alta del partido con los datos del formulario, delegando la
   * creación en {@link MatchService} y agregando el resultado al principio
   * del listado.
   */
  confirmCreateMatch(): void {
    if (!this.canCreateMatch) {
      return;
    }

    this.matchService.createMatch(this.draft).subscribe({
      next: newMatch => {
        this.matches = [newMatch, ...this.matches];
        this.isCreateOpen = false;
      },
      error: () => this.errorMessage = 'No se pudo crear el partido.',
    });
  }

  confirmDeleteMatch(match: Match): void {
    if (!window.confirm(`¿Eliminar el partido contra ${match.opponent}?`)) {
      return;
    }

    this.matchService.deleteMatch(match.id).subscribe({
      next: () => {
        this.matches = this.matches.filter(currentMatch => currentMatch.id !== match.id);
      },
      error: () => this.errorMessage = 'No se pudo eliminar el partido.',
    });
  }

  openMatch(match: Match): void {
    if (match.status === 'not_started') {
      // Si no empezó, va a la pantalla nueva que acabas de crear
      void this.router.navigate(['/selection-roster', match.id]);
    } else {
      // Si ya está en progreso o finalizado, va a la pantalla de la imagen
      void this.router.navigate(['/carga-en-vivo', match.id]);
    }
  }

  /**
   * Etiqueta legible para el estado de un partido. Reutiliza el mismo mapa
   * que las opciones del filtro, ya que comparten los mismos textos.
   */
  statusLabel(status: MatchStatus): string {
    return this.statusLabels[status];
  }

  /** Formatea la fecha ISO del partido como "sáb 20 sep", en español y sin depender del locale del navegador. */
  formatMatchDate(dateInput: any): string {
    if (!dateInput) return 'Fecha sin definir';

    const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    let date: Date;

    if (Array.isArray(dateInput)) {
      // Si Spring Boot lo manda como array: [year, month, day, hour, minute]
      // Recordar que en JavaScript los meses van de 0 a 11
      date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2]);
    } else if (typeof dateInput === 'string') {
      // Si llega como string (ej: "2026-09-23" o "2026-09-23T00:00:00")
      const datePart = dateInput.split('T')[0]; // Nos quedamos solo con la parte de la fecha
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      return 'Fecha inválida';
    }

    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  }
}