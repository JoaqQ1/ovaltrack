import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Match } from '../types/match.types';
import { MatchService } from '../services/match.service';
import { DivisionService } from 'src/app/services/division.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../modal/modal.component';

@Component({
  selector: 'ot-match-history',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, ModalComponent],
  templateUrl: './match-history.component.html',
  styleUrl: './match-selection.component.css', // Reutilizamos los mismos estilos
})
export class MatchHistoryComponent implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly divisionService = inject(DivisionService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  
  matches: Match[] = [];
  userDivisions: any[] = [];
  selectedDivisionId: string = '';
 
  selectedMatchForModal: Match | null = null;
  isMatchModalOpen = false;
  isCalendarView = false;

  filterOponent: string = '';
  filterResult: 'ALL' | 'WON' | 'LOST' | 'TIED' = 'ALL';

  calendarOptions: CalendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, interactionPlugin],
      locale: 'es',
      buttonText: {
        today: 'Hoy',
        month: 'Mes',
        week: 'Semana',
      },
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: ''
      },
      events: [],
      eventClick: this.handleEventClick.bind(this),
      // -- NUEVO ESTILO DE EVENTOS --
      eventBackgroundColor: '#1d3b20', // El verde de tus botones
      eventBorderColor: '#1d3b20',
      eventTextColor: '#ffffff',
      eventDisplay: 'block',
      eventContent: function(arg) {
        // 1. Extraemos la hora y minutos del objeto Date del evento
        const date = arg.event.start;
        let timeString = '';
        
        if (date) {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          timeString = `${hours}:${minutes} hs`;
        }
  
        // 2. Armamos un mini-layout HTML. 
        // Usamos text-align: left, un color un poco más transparente para la hora, y negrita para el rival.
        return {
          html: `
            <div style="padding: 4px 6px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; text-align: left;">
              <span style="font-size: 0.75em; font-weight: 600; color: #a3cda6; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${timeString}
              </span>
              <strong style="font-size: 0.85em; white-space: normal; line-height: 1.2;">
                ${arg.event.title}
              </strong>
            </div>
          `
        };
      }
    };

  ngOnInit(): void {
    this.loadUserDivisions();
  }

  get oponentsAvailables(): string[] {
    const finalizados = this.matches.filter(m => m.status === 'finished');
    return [...new Set(finalizados.map(m => m.opponent))].sort();
  }

  get visibleMatches(): Match[] {
    // Solo nos interesan los finalizados
    let filtered = this.matches.filter(match => match.status === 'finished');

    // A. Filtro por Oponente (Búsqueda por texto)
    if (this.filterOponent.trim() !== '') {
      const termino = this.filterOponent.toLowerCase().trim();
      filtered = filtered.filter(match => 
        match.opponent.toLowerCase().includes(termino)
      );
    }

    // B. Filtro por Resultado
    if (this.filterResult !== 'ALL') {
      filtered = filtered.filter(match => {
        const home = match.homeScore || 0;
        const away = match.awayScore || 0;
        
        if (this.filterResult === 'WON') return home > away;
        if (this.filterResult === 'LOST') return home < away;
        if (this.filterResult === 'TIED') return home === away;
        return true;
      });
    }

    return filtered;
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

  loadUserDivisions() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const currentClubId = decodedPayload.clubId || decodedPayload.club_id;

      if (!currentClubId) return;

      this.divisionService.getDivisiones(currentClubId).subscribe(divisions => {
        this.userDivisions = divisions;
        if (this.userDivisions.length > 0) {
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
        this.actualizarEventosCalendario(this.visibleMatches); // <--- AGREGAR ESTO
      },
      error: () => {
        this.toastService.show('error', 'No se pudieron cargar los partidos de esta división.', 'Error de carga');
        this.matches = [];
        this.actualizarEventosCalendario(this.visibleMatches); // <--- AGREGAR ESTO
      }
    });
  }

  goBack() {
    // Para el botón de volver
    this.router.navigate(['/match-selection']);
  }

  openMatch(match: Match) {
    // Al hacer clic, navega a las estadísticas
    this.router.navigate(['/post-match', match.id]);
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

  actualizarEventosCalendario(partidosFiltrados: Match[]) {
    const eventos = partidosFiltrados.map(partido => {
      let isoDate = partido.date;

      if (Array.isArray(partido.date)) {
          const [year, month, day, hours = 0, minutes = 0] = partido.date;
          isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      }
      
      const divisionName = this.userDivisions.find(d => d.id === this.selectedDivisionId)?.name || 'División';

      return {
        id: partido.id,
        title: `${partido.opponent || 'Rival'}`,
        start: isoDate,
        extendedProps: { match: partido }
      };
    });
  
    this.calendarOptions = {
      ...this.calendarOptions,
      events: eventos
    };
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

  setFilterResult(result: 'ALL' | 'WON' | 'LOST' | 'TIED') {
    this.filterResult = result;
    this.actualizarEventosCalendario(this.visibleMatches);
  }

  // Método para la barra de búsqueda de texto
  onSearchChange() {
    this.actualizarEventosCalendario(this.visibleMatches);
  }
}