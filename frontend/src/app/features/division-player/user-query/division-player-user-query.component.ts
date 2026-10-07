import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DivisionService } from 'src/app/services/division.service';
import { DivisionPlayerService } from 'src/app/services/division-player.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Division } from '../../division/types/division.types';
import { DivisionPlayerPersonUserResponse } from '../type/division-player.types';

@Component({
  selector: 'app-division-player-user-query',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './division-player-user-query.component.html',
  styleUrl: './division-player-user-query.component.css'
})
export class DivisionPlayerUserQueryComponent implements OnInit {
  private readonly divisionService = inject(DivisionService);
  private readonly divisionPlayerService = inject(DivisionPlayerService);
  private readonly userContext = inject(UserContextService);

  divisions: Division[] = [];
  selectedDivisionId = '';
  results: DivisionPlayerPersonUserResponse[] = [];
  loadingDivisions = true;
  loadingResults = false;
  errorMessage = '';

  ngOnInit(): void {
    const clubId = this.userContext.currentClub()?.id;
    if (!clubId) {
      this.loadingDivisions = false;
      this.errorMessage = 'No se encontró un club para el usuario actual.';
      return;
    }

    this.divisionService.getDivisiones(clubId).subscribe({
      next: (divisions) => {
        this.divisions = divisions;
        this.loadingDivisions = false;
      },
      error: () => {
        this.loadingDivisions = false;
        this.errorMessage = 'No se pudieron cargar las divisiones.';
      }
    });
  }

  selectDivision(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedDivisionId = select.value;
    this.results = [];
    this.errorMessage = '';

    if (!this.selectedDivisionId) {
      return;
    }

    this.loadingResults = true;
    this.divisionPlayerService.getWithPersonAndUserByDivisionId(this.selectedDivisionId).subscribe({
      next: (results) => {
        this.results = results;
        this.loadingResults = false;
      },
      error: () => {
        this.loadingResults = false;
        this.errorMessage = 'No se pudo cargar la información de la división.';
      }
    });
  }
}
