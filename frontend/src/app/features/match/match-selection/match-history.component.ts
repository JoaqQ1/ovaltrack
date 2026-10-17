import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Match } from '../types/match.types';
import { MatchService } from '../services/match.service';
import { DivisionService } from 'src/app/services/division.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'ot-match-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
 
  filterOponent: string = '';
  filterResult: 'ALL' | 'WON' | 'LOST' | 'TIED' = 'ALL';
  filterOrderDate: 'DESC' | 'ASC' = 'DESC';

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

    // C. Ordenamiento por Fecha
    filtered = filtered.sort((a, b) => {
      const dateA = this.parseDateForSort(a.date).getTime();
      const dateB = this.parseDateForSort(b.date).getTime();
      return this.filterOrderDate === 'DESC' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }

  toggleOrdenFecha(): void {
    this.filterOrderDate = this.filterOrderDate === 'DESC' ? 'ASC' : 'DESC';
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
      },
      error: () => {
        this.toastService.show('error', 'No se pudieron cargar los partidos de esta división.', 'Error de carga');
        this.matches = [];
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
}