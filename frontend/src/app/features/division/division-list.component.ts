import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, of, catchError } from 'rxjs';
import { DivisionService } from 'src/app/services/division.service';
import { ClubService } from 'src/app/services/club.service';
import { Division, ClubSummary } from './types/division.types';

@Component({
  selector: 'app-division-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './division-list.component.html',
  styleUrl: './division-list.component.css'
})
export class DivisionListComponent implements OnInit {
  private readonly divisionService = inject(DivisionService);
  private readonly clubService = inject(ClubService);
  private readonly destroyRef = inject(DestroyRef);

  myClub: ClubSummary | null = null;
  divisions: Division[] = [];
  cargando: boolean = false;
  error: string = '';

  ngOnInit(): void {
    this.cargarClubYDivisiones();
  }

  cargarClubYDivisiones(): void {
    this.cargando = true;
    this.error = '';

    this.clubService.getMyClub()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((club: ClubSummary) => {
          this.myClub = club;
          if (!club?.id) {
            return of([]);
          }
          return this.divisionService.getDivisiones(club.id).pipe(
            catchError((err) => {
              console.error('Error al cargar las divisiones', err);
              this.error = 'No se pudieron cargar las divisiones de tu club.';
              return of([]);
            })
          );
        }),
        catchError((err) => {
          console.error('Error al cargar el club del usuario', err);
          this.error = 'No se pudo obtener la información de tu club.';
          return of([]);
        })
      )
      .subscribe((divisions: Division[]) => {
        this.divisions = divisions;
        this.cargando = false;
      });
  }
}