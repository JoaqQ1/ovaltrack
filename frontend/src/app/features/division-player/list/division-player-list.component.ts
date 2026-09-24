import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { NavbarAuthComponent } from 'src/app/shared/components/navbar-auth/navbar-auth.component';
import { DivisionPlayerService } from 'src/app/services/division-player.service';
import { DivisionService } from 'src/app/services/division.service';
import { PersonService } from 'src/app/services/person.service';
import { Division } from '../../division/types/division.types';
import { DivisionPlayerResponse } from '../type/division-player.types';
import { PersonResponse } from '../../person/types/person.types';


@Component({
  selector: 'app-division-player-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarAuthComponent],
  templateUrl: './division-player-list.component.html',
  styleUrl: './division-player-list.component.css'
})
export class DivisionPlayerListComponent implements OnInit {
    private readonly divisionService = inject(DivisionService);
    private readonly personService = inject(PersonService);
    private readonly divisionPlayerService = inject(DivisionPlayerService);
    private readonly route = inject(ActivatedRoute);

    division: Division | null = null;
    players: DivisionPlayerResponse[] = [];
    persons: PersonResponse[] = [];
    mensajeError = '';

    ngOnInit(): void {
        this.cargarJugadores();
    }

  cargarJugadores(): void {
    this.mensajeError = '';

    this.route.paramMap.pipe(
      switchMap((params) => {
        const divisionId = params.get('divisionId');
        if (!divisionId) {
          throw new Error('No se recibió el ID de la división.');
        }

        return forkJoin({
          division: this.divisionService.getDivisionById(divisionId),
          players: this.divisionPlayerService.getByDivisionId(divisionId)
        });
      }),
      switchMap(({ division, players }) => {
        if (players.length === 0) {
          return of({ division, players, persons: [] as PersonResponse[] });
        }

        return forkJoin(
          players.map(player => this.personService.getPersonById(player.personId))
        ).pipe(
          switchMap((persons) => of({ division, players, persons }))
        );
      })
    ).subscribe({
      next: ({ division, players, persons }) => {
        this.division = division;
        this.players = players;
        this.persons = persons;
      },
      error: (err) => {
        console.error('Error al cargar los jugadores de la división', err);
        this.players = [];
        this.persons = [];
        this.mensajeError = 'No se pudieron cargar los jugadores de la división.';
      }
    });
  }

    desasociarJugador(player: DivisionPlayerResponse): void {
        this.mensajeError = '';
        this.divisionPlayerService.remove(player.id).subscribe({
            next: () => {
                this.cargarJugadores();
            },
            error: (err) => {
                console.error('Error al desasociar jugador', err);
                this.mensajeError = typeof err.error === 'string'
                ? err.error
                : (err.error?.message || 'No se pudo desasociar el jugador.');
            }
        });
    }

    cargarPersonas() {
        
    }

}
