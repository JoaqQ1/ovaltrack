import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Match,
  MATCH_FILTERS,
  MATCH_STATUS_LABELS,
  MatchFilter,
  MatchStatus,
  NewMatchDraft,
} from '../types/match.types';
import { MatchService } from '../services/match.service';
import { DivisionService } from 'src/app/services/division.service';
import { RosterService } from '../services/roster.service';

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
  private readonly rosterService = inject(RosterService);
  private readonly router = inject(Router);
  private readonly divisionService = inject(DivisionService);

  /** Filtros disponibles, en el orden en que se renderizan en el control segmentado. */
  readonly filters = MATCH_FILTERS;
  readonly statusLabels = MATCH_STATUS_LABELS;

  matches: Match[] = [];
  userDivisions: any[] = [];
  selectedDivisionId: string = '';

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
    // Solo cargamos las divisiones al iniciar. Los partidos se cargan después.
    this.loadUserDivisions();
  }

  /** Partidos visibles según {@link activeFilter}. */
  get visibleMatches(): Match[] {
    if (this.activeFilter === 'all') {
      return this.matches.filter(match => match.status !== 'cancelled');
    }

    if (this.activeFilter === 'in_progress') {
      return this.matches.filter(match => match.status === 'in_progress' || match.status === 'halftime');
    }

    return this.matches.filter(match => match.status === this.activeFilter);
  }

  /** Si el formulario de alta tiene los dos campos requeridos completos. */
  get canCreateMatch(): boolean {
    return this.draft.date.trim().length > 0 && this.draft.opponent.trim().length > 0 && this.selectedDivisionId.length > 0;
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

    this.matchService.createMatch(this.draft, this.selectedDivisionId).subscribe({
      next: newMatch => {
        this.matches = [newMatch, ...this.matches];
        this.isCreateOpen = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readBackendError(error) ?? 'No se pudo crear el partido.';
      },
    });
  }

  confirmDeleteMatch(match: Match): void {
    if (!window.confirm(`¿Eliminar el partido contra ${match.opponent}?`)) {
      return;
    }

    this.matchService.deleteMatch(match.id).subscribe({
      next: () => {
        this.matches = this.matches.map(currentMatch => currentMatch.id === match.id
          ? { ...currentMatch, status: 'cancelled' }
          : currentMatch);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.readBackendError(error) ?? 'No se pudo eliminar el partido.';
      },
    });
  }

  /** Navega a la captura en vivo solo si el partido tiene titulares completos. */
  startMatch(matchId: string): void {
    this.navigateToLiveCaptureIfRosterIsValid(matchId);
  }


  onSelectMatch(match: Match) {
    this.openMatch(match);
    this.selectMatch.emit(match);
  }

  isLive(match: Match): boolean {
    return match.status === 'in_progress' || match.status === 'halftime';
  }

  get emptyMessage(): string {
    return this.activeFilter !== 'all'
      ? `No se encontraron partidos en estado "${this.statusLabels[this.activeFilter]}".`
      : 'Aún no tienes partidos creados. Haz clic en "+ Crear partido" para programar el próximo encuentro.';
  }

  private readBackendError(error: HttpErrorResponse): string | null {
    return typeof error.error === 'string' ? error.error : error.error?.message ?? null;
  }

  openMatch(match: Match): void {
    if (match.status === 'cancelled') return;

    if (match.status === 'not_started') {
      void this.router.navigate(['/selection-roster', match.id]);
    } else if (match.status === 'halftime') {
      void this.router.navigate(['/live-capture/', match.id, 'halftime'])
    } else if (match.status === 'finished'){
      void this.router.navigate(['/post-match', match.id])
    } else{
      this.navigateToLiveCaptureIfRosterIsValid(match.id);
    }
  }

  private navigateToLiveCaptureIfRosterIsValid(matchId: string): void {
    this.rosterService.getSavedRoster(matchId).subscribe({
      next: roster => {
        if (this.hasValidRoster(roster?.startingPlayers)) {
          void this.router.navigate(['/live-capture', matchId]);
          return;
        }

        this.errorMessage = 'Debes completar los 15 titulares antes de capturar el partido.';
        //void this.router.navigate(['/selection-roster', matchId]);
      },
      error: () => {
        this.errorMessage = 'No se pudo validar la alineación del partido.';
      },
    });
  }

  private hasValidRoster(startingPlayers: string[] | undefined): boolean {
    return startingPlayers !== undefined
      && startingPlayers.length === 15
      && new Set(startingPlayers).size === 15;
  }

  /**
   * Etiqueta legible para el estado de un partido. Reutiliza el mismo mapa
   * que las opciones del filtro, ya que comparten los mismos textos.
   */
  statusLabel(status: MatchStatus): string {
    return status === 'cancelled' ? 'Cancelado' : this.statusLabels[status];
  }

  /** Formatea la fecha ISO del partido como "sáb 20 sep", en español y sin depender del locale del navegador. */
  formatMatchDate(dateInput: any): string {
    if (!dateInput) return 'Fecha sin definir';

    const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    let date: Date;

    if (Array.isArray(dateInput)) {
      date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2]);
    } else if (typeof dateInput === 'string') {
      const datePart = dateInput.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      return 'Fecha inválida';
    }

    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  }

  loadUserDivisions() {
    const token = localStorage.getItem('auth_token'); // Usamos el nombre exacto de tu imagen

    if (!token) {
      console.error("No se encontró el token de sesión");
      return;
    }

    try {
      // Un JWT tiene 3 partes separadas por puntos. La del medio [1] es el Payload (los datos).
      const payloadBase64 = token.split('.')[1];
      
      // Decodificamos el Base64 a texto y lo convertimos en un objeto JSON
      const decodedPayload = JSON.parse(atob(payloadBase64));
      
      // Intentamos obtener el clubId (revisa la consola si el nombre de la propiedad es distinto)
      const currentClubId = decodedPayload.clubId || decodedPayload.club_id;

      if (!currentClubId) {
        console.error("El token es válido, pero no contiene el ID del club. Contenido del token:", decodedPayload);
        return;
      }

      this.divisionService.getDivisiones(currentClubId).subscribe(divisions => {
        this.userDivisions = divisions;

        if (this.userDivisions.length > 0) {
          // Autoseleccionar la primera división
          this.selectedDivisionId = this.userDivisions[0].id;
          this.loadMatchesForDivision(this.selectedDivisionId);
        }
      });

    } catch (error) {
      console.error("Error al decodificar el token de sesión", error);
    }
  }

  onDivisionChange(divisionId: string) {
    this.selectedDivisionId = divisionId;
    this.loadMatchesForDivision(divisionId);
  }

  loadMatchesForDivision(divisionId: string) {
    // Usamos el servicio y asignamos el resultado a this.matches
    this.matchService.getAllMatchesByDivisionId(divisionId).subscribe({
      next: (matches) => {
        this.matches = matches;
        this.errorMessage = '';
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los partidos de esta división.';
        this.matches = [];
      }
    });
  }
}