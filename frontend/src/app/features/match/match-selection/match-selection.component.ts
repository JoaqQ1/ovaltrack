import { Component, EventEmitter, OnInit, Output, ViewChild, inject } from '@angular/core';
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
import { ModalComponent } from '../../modal/modal.component';
import { ToastService } from 'src/app/core/services/toast.service';
import { LiveCaptureService } from '../services/live-capture.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { FullCalendarComponent } from '@fullcalendar/angular';

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
  imports: [CommonModule, FormsModule, ModalComponent, FullCalendarModule],
  templateUrl: './match-selection.component.html',
  styleUrl: './match-selection.component.css',
})
export class MatchSelectComponent implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly rosterService = inject(RosterService);
  private readonly router = inject(Router);
  private readonly divisionService = inject(DivisionService);
  private readonly opponentService = inject(OpponentService);
  private readonly liveCaptureService = inject(LiveCaptureService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  /** Filtros disponibles, en el orden en que se renderizan en el control segmentado, menos el finalizado. */
  readonly filters = MATCH_FILTERS.filter(f => f !== 'finished');
  readonly statusLabels = MATCH_STATUS_LABELS;

  matches: Match[] = [];
  userDivisions: any[] = [];
  selectedDivisionId: string = '';
  availableOpponents: Opponent[] = [];
  /** Filtro actualmente seleccionado en el control segmentado. */
  activeFilter: MatchFilter = 'all';

  /** Si el panel de alta de partido está abierto. */
  isCreateOpen = false;

  /** Datos del formulario de alta, en curso de carga. */
  draft: NewMatchDraft = { date: '', opponentId: '' };

  matchToRemove: Match | null = null;
  eliminatingMatchId: string | null = null;
  mostrarModalConfirmacion = false;

  selectedMatchForModal: Match | null = null;
  isMatchModalOpen = false;

  // 1. Agregá esta variable en tu clase:
  isPickerOpen = false;
  isDayModalOpen = false;
  isYearView = false;
  pickerYear = new Date().getFullYear();
  readonly monthsShort = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  selectedMonth: string = '';
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  matchesForDayModal: Match[] = [];



  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin, multiMonthPlugin], // Agregado multiMonthPlugin
    locale: 'es',
    height: 'auto',
    buttonText: { today: 'Hoy', month: 'Mes', year: 'Año' },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,multiMonthYear', // Botón anual
    },
    views: {
      dayGridMonth: {
        titleFormat: (arg) => {
          const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
          const d = arg.date.marker;
          return `${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        },
      },
      multiMonthYear: {
        titleFormat: { year: 'numeric' },
        multiMonthTitleFormat: { month: 'long' },
        multiMonthMaxColumns: 4,
        multiMonthMinWidth: 220,
        dayHeaderFormat: { weekday: 'narrow' },
        showNonCurrentDates: false,
        fixedWeekCount: false,
        dayMaxEvents: false,
      },
    },
    datesSet: (arg) => {
      const d = arg.view.currentStart;
      this.selectedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },
    events: [],
    
    // Conectores de clics y estilos
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    dayCellClassNames: this.getDayClassNames.bind(this),
    
    eventBackgroundColor: '#1d3b20',
    eventBorderColor: '#1d3b20',
    eventTextColor: '#ffffff',
    eventDisplay: 'block',
    eventContent: function (arg) {
      if (arg.view.type === 'multiMonthYear') {
        return { html: '<span></span>' }; // Oculta info en vista anual (solo usa el fondo verde)
      }
      
      const date = arg.event.start;
      let timeString = '';
      if (date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        timeString = `${hours}:${minutes} hs`;
      }

      const match = arg.event.extendedProps['match'];
      const scoreString = (match && match.homeScore !== undefined && match.awayScore !== undefined)
        ? `${match.homeScore} - ${match.awayScore}`
        : '';

      return {
        html: `
          <div style="padding: 6px 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; text-align: left; width: 100%; box-sizing: border-box;">
            <span style="font-size: 0.75rem; font-weight: 500; color: #a3cda6; display: flex; align-items: center; gap: 4px; line-height: 1;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${timeString}
            </span>
            <strong style="font-size: 0.85rem; font-weight: 700; color: #ffffff; white-space: normal; line-height: 1.2;">
              ${arg.event.title}
            </strong>
            ${scoreString ? `<span style="font-size: 0.9rem; font-weight: 700; color: #ffffff; line-height: 1;">${scoreString}</span>` : ''}
          </div>
        `
      };
    }
  };

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
    this.actualizarEventosCalendario(this.visibleMatches);
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
        this.actualizarEventosCalendario(this.visibleMatches);
        this.isCreateOpen = false;
      },
      error: (error: HttpErrorResponse) => {
        const msg = this.readBackendError(error) ?? 'No se pudo crear el partido.';
        this.toastService.show('error', msg, 'Error al crear partido');
      },
    });
  }

  confirmDeleteMatch(match: Match): void {
    if (match.status === 'cancelled' || this.eliminatingMatchId) {
      return;
    }

    this.matchToRemove = match;
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminacion(): void {
    if (!this.eliminatingMatchId) {
      this.mostrarModalConfirmacion = false;
      this.matchToRemove = null;
    }
  }

  ejecutarEliminacion(): void {
    if (!this.matchToRemove) {
      return;
    }

    this.eliminatingMatchId = this.matchToRemove.id;
    this.matchService.deleteMatch(this.matchToRemove.id).subscribe({
      next: () => {
        this.matches = this.matches.map(currentMatch => 
          currentMatch.id === this.matchToRemove?.id
            ? { ...currentMatch, status: 'cancelled' }
            : currentMatch
        );
        this.actualizarEventosCalendario(this.visibleMatches);
        this.eliminatingMatchId = null;
        this.mostrarModalConfirmacion = false;
        this.matchToRemove = null;
      },
      error: (error: HttpErrorResponse) => {
        const msg = this.readBackendError(error) ?? 'No se pudo eliminar el partido.';
        this.toastService.show('error', msg, 'Error al eliminar');
        this.eliminatingMatchId = null;
        this.mostrarModalConfirmacion = false;
        this.matchToRemove = null;
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

        this.toastService.show('error', 'Debes completar los 15 titulares antes de capturar el partido.', 'Alineación incompleta');
      },
      error: () => {
        this.toastService.show('error', 'No se pudo validar la alineación del partido.', 'Error de validación');
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
    let timeStr = '';

    if (Array.isArray(dateInput)) {
      date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0);
      if (dateInput[3] !== undefined && dateInput[4] !== undefined) {
        timeStr = ` - ${String(dateInput[3]).padStart(2, '0')}:${String(dateInput[4]).padStart(2, '0')} hs`;
      }
    } else if (typeof dateInput === 'string') {
      const [datePart, timePart] = dateInput.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day);
      if (timePart) {
        const [hours, minutes] = timePart.split(':');
        timeStr = ` - ${hours}:${minutes} hs`;
      }
    } else {
      return 'Fecha inválida';
    }

    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}${timeStr}`;
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
        this.cacheMatchData(matches);
        this.actualizarEventosCalendario(this.visibleMatches);
      },
      error: () => {
        this.toastService.show('error', 'No se pudieron cargar los partidos de esta división.', 'Error de carga');
        this.matches = [];
        this.actualizarEventosCalendario(this.visibleMatches);
      }
    });
  }

  openCreateModal(): void {
    this.draft = { date: '', opponentId: '' };
    this.isCreateOpen = true;
    
    this.opponentService.getAllOpponents().subscribe({
      next: (opponents) => this.availableOpponents = opponents,
      error: () => this.toastService.show('error', 'No se pudieron cargar los rivales disponibles.', 'Error')
    });
  }

  goToOpponents() {
    this.router.navigate(['/opponent']);
  } 

  get isAdmin(): boolean {
    const role = this.authService.getUserRole();
    return role === 'ADMIN_CLUB' || role === 'ADMIN_OVALTRACK';
  }

  //ta raro esto, no me gusta del todo usar el mismo filtro de partidos tanto en LiveCaptureCacheService como aca
  private cacheMatchData(matches: Match[]): void {
    if (matches.length === 0) {
      return;
    }

    const offlineMatches = matches.filter(
      m => m.status === 'not_started' || m.status === 'in_progress' || m.status === 'halftime'
    );

    forkJoin(
      matches.map(match => 
        forkJoin([
          this.rosterService.getSavedRoster(match.id).pipe(catchError(() => of(null))),
          this.rosterService.getAvailablePlayers(match.id).pipe(catchError(() => of([])))
        ])
      )
    ).subscribe();

    if (offlineMatches.length > 0) {
      forkJoin(
        offlineMatches.map(match =>
          this.liveCaptureService.hydrateMatchEvents(match.id).pipe(
            catchError(() => of([]))
          )
        )
      ).subscribe();
    }
  }

  actualizarEventosCalendario(partidosFiltrados: Match[]) {
    const eventos = partidosFiltrados.map(partido => {
      let isoDate = partido.date;
      if (Array.isArray(partido.date)) {
          const [year, month, day, hours = 0, minutes = 0] = partido.date;
          isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }
      
      const bgColor = this.getMatchColor(partido);

      return {
        id: partido.id,
        title: `${partido.opponent || 'Rival'}`,
        start: isoDate,
        backgroundColor: bgColor, // <--- Aplica el color dinámico
        borderColor: bgColor,
        extendedProps: { match: partido }
      };
    });
  
    this.calendarOptions = { ...this.calendarOptions, events: eventos };
  }

  handleEventClick(clickInfo: any) {
    const match = clickInfo.event.extendedProps.match;
    this.selectedMatchForModal = match;
    this.isMatchModalOpen = true;
  }

  closeMatchModal() {
    this.isMatchModalOpen = false;
    this.selectedMatchForModal = null;
  }

  changePickerYear(delta: number): void {
    this.pickerYear += this.isYearView ? delta * 12 : delta;
  }

  get pickerYears(): number[] {
    // 12 años alrededor del año actual del picker
    const start = this.pickerYear - 5;
    return Array.from({ length: 12 }, (_, i) => start + i);
  }

  get currentYear(): number {
  return Number(this.selectedMonth.slice(0, 4)) || new Date().getFullYear();
  }

  selectYear(year: number): void {
    const api = this.calendarComponent.getApi();
    api.gotoDate(new Date(year, 0, 1));
    this.isPickerOpen = false;
  }

  get currentMonthIdx(): number {
    return (Number(this.selectedMonth.slice(5, 7)) || 1) - 1;
  }

  selectMonth(monthIdx: number): void {
    this.calendarComponent.getApi().gotoDate(new Date(this.pickerYear, monthIdx, 1));
    this.isPickerOpen = false;
  }

  onCalendarClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.fc-toolbar-title')) {
      this.isYearView = this.calendarComponent.getApi().view.type === 'multiMonthYear';
      this.pickerYear = this.currentYear;
      this.isPickerOpen = !this.isPickerOpen;
    }
  }

  private parseDateForSort(dateInput: any): Date {
    if (!dateInput) return new Date(0);
    if (Array.isArray(dateInput)) {
      return new Date(dateInput[0], dateInput[1] - 1, dateInput[2]);
    } else if (typeof dateInput === 'string') {
      const datePart = dateInput.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(0);
  }

  getDayClassNames(arg: any) {
    if (arg.view.type === 'multiMonthYear') {
      const matchesOnDay = this.visibleMatches.filter(m => {
        const md = this.parseDateForSort(m.date);
        return md.getFullYear() === arg.date.getFullYear() &&
               md.getMonth() === arg.date.getMonth() &&
               md.getDate() === arg.date.getDate();
      });
      
      if (matchesOnDay.length > 0) {
        let category = 'WON'; 
        // Prioridad de visualización si hay varios partidos el mismo día
        if (matchesOnDay.some(m => this.getMatchCategory(m) === 'LIVE')) category = 'LIVE';
        else if (matchesOnDay.some(m => this.getMatchCategory(m) === 'UPCOMING')) category = 'UPCOMING';
        else category = this.getMatchCategory(matchesOnDay[0]);
        
        return ['day-with-match', `day-status-${category.toLowerCase()}`];
      }
    }
    return [];
  }

  handleDateClick(arg: any) {
    if (arg.view.type === 'multiMonthYear') {
      // Lógica existente para la vista anual...
      const clickedDate = arg.date;
      const matchesOnDay = this.visibleMatches.filter(m => {
        const md = this.parseDateForSort(m.date);
        return md.getFullYear() === clickedDate.getFullYear() &&
               md.getMonth() === clickedDate.getMonth() &&
               md.getDate() === clickedDate.getDate();
      });
      
      if (matchesOnDay.length > 0) {
        this.matchesForDayModal = matchesOnDay;
        this.isDayModalOpen = true;
      }
    } else if (arg.view.type === 'dayGridMonth') {
      // NUEVO: Lógica para la vista mensual (Crear partido directo)
      
      this.openCreateModal(); // Abrimos el modal
      
      // Extraemos el año, mes y día del clic
      const clickedDate = arg.date;
      const year = clickedDate.getFullYear();
      const month = String(clickedDate.getMonth() + 1).padStart(2, '0');
      const day = String(clickedDate.getDate()).padStart(2, '0');
      
      // Autocompletamos la fecha y le damos un horario por defecto (ej. 15:30 hs)
      this.draft.date = `${year}-${month}-${day}T16:00`;
    }
  }

  closeDayModal() {
    this.isDayModalOpen = false;
    this.matchesForDayModal = [];
  }

  getMatchTime(dateInput: any): string {
    if (Array.isArray(dateInput)) {
      const h = dateInput[3] !== undefined ? String(dateInput[3]).padStart(2, '0') : '00';
      const m = dateInput[4] !== undefined ? String(dateInput[4]).padStart(2, '0') : '00';
      return `${h}:${m}`;
    } else if (typeof dateInput === 'string') {
      const timePart = dateInput.split('T')[1];
      if (timePart) {
        const [h, m] = timePart.split(':');
        return `${h}:${m}`;
      }
    }
    return '00:00';
  }

  openMatchDetailsFromDayModal(match: Match) {
    this.closeDayModal();
    this.selectedMatchForModal = match;
    this.isMatchModalOpen = true;
  }

  // Determina la categoría del partido
  getMatchCategory(match: Match): 'LIVE' | 'UPCOMING' | 'WON' | 'LOST' | 'TIED' | 'CANCELLED' {
    if (match.status === 'cancelled') return 'CANCELLED';
    if (match.status === 'in_progress' || match.status === 'halftime') return 'LIVE';
    if (match.status === 'not_started' || match.status === 'empty_roster') return 'UPCOMING';
    
    const home = match.homeScore || 0;
    const away = match.awayScore || 0;
    if (home > away) return 'WON';
    if (home < away) return 'LOST';
    return 'TIED';
  }

  // Devuelve el color oscuro para las tarjetas (Vista mensual y modal)
  getMatchColor(match: Match): string {
    switch (this.getMatchCategory(match)) {
      case 'LIVE': return '#ca8a04';     // Ámbar
      case 'UPCOMING': return '#475569'; // Gris azulado
      case 'WON': return '#1d3b20';      // Verde oscuro
      case 'LOST': return '#b42318';     // Rojo oscuro
      case 'TIED': return '#0369a1';     // Azul oscuro
      case 'CANCELLED': return '#94a3b8';// Gris claro
      default: return '#1d3b20';
    }
  }
}