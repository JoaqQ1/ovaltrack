import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
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
import { OpponentService, Opponent } from '../services/opponent.service';
import { AuthService } from '../../auth/services/auth.service';

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
  private readonly opponentService = inject(OpponentService);
    private readonly authService = inject(AuthService);

  /** Filtros disponibles, en el orden en que se renderizan en el control segmentado, menos el finalizado. */
  readonly filters = MATCH_FILTERS.filter(f => f !== 'finished');
  readonly statusLabels = MATCH_STATUS_LABELS;

  matches: Match[] = [];
  userDivisions: any[] = [];
  selectedDivisionId: string = '';
  availableOpponents: Opponent[] = []
  /** Filtro actualmente seleccionado en el control segmentado. */
  activeFilter: MatchFilter = 'all';

  /** Si el panel de alta de partido está abierto. */
  isCreateOpen = false;

  /** Datos del formulario de alta, en curso de carga. */
  draft: NewMatchDraft = { date: '', opponentId: '' };
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

  
  goToHistory() {
    this.router.navigate(['/match-history']);
  }

  get visibleMatches(): Match[] {
    // Filtramos los finalizados de la memoria (ahora viven en la otra pantalla)
    let activeMatches = this.matches.filter(match => match.status !== 'finished');

    if (this.activeFilter === 'all') {
      return activeMatches.filter(match => match.status !== 'cancelled');
    }

    if (this.activeFilter === 'in_progress') {
      return activeMatches.filter(match => match.status === 'in_progress' || match.status === 'halftime');
    }

    return activeMatches.filter(match => match.status === this.activeFilter);
  }

  get canCreateMatch(): boolean {
    return this.draft.date.trim().length > 0 
        && this.draft.opponentId.trim().length > 0 
        && this.selectedDivisionId.length > 0;
  }

  setFilter(filter: MatchFilter): void {
    this.activeFilter = filter;
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

    if (match.status === 'not_started' || match.status === 'empty_roster') {
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
    this.matchService.getAllMatchesByDivisionId(divisionId).subscribe({
      next: (matches) => {
        this.matches = matches;
        this.errorMessage = '';
        this.cacheRosters(matches);
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los partidos de esta división.';
        this.matches = [];
      }
    });
  }

  openCreateModal(): void {
    this.draft = { date: '', opponentId: '' };
    this.isCreateOpen = true;
    
    this.opponentService.getAllOpponents().subscribe({
      next: (opponents) => this.availableOpponents = opponents,
      error: () => this.errorMessage = 'No se pudieron cargar los rivales disponibles.'
    });
  }

  goToOpponents() {
    this.router.navigate(['/opponent']);
  } 

  get isAdmin(): boolean {
    const role = this.authService.getUserRole();
    return role === 'ADMIN_CLUB' || role === 'ADMIN_OVALTRACK';
  }

  private cacheRosters(matches: Match[]): void {
    if (matches.length === 0) {
      return;
    }

    forkJoin(
      matches.map(match => 
        forkJoin([
          this.rosterService.getSavedRoster(match.id).pipe(catchError(() => of(null))),
          this.rosterService.getAvailablePlayers(match.id).pipe(catchError(() => of([])))
        ])
      )
    ).subscribe();
  }
}