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
    activePlayers: DivisionPlayerResponse[] = [];
    playerHistory: DivisionPlayerResponse[] = [];
    activePersons: PersonResponse[] = [];
    mensajeError = '';

    allPlayers: PersonResponse[] = [];
    mostrarFormularioAsociacion = false;

    ngOnInit(): void {
        this.cargarJugadoresActivos();
    }

    mostrarJugadores(): void {
      if (this.mostrarFormularioAsociacion) {
        // Toggle OFF if already visible
        this.mostrarFormularioAsociacion = false;
        return;
      }

      if (!this.division?.clubId) {
        this.mensajeError = 'No se pudo obtener los jugadores del club porque el ID del club no está disponible.';
        return;
      }

      this.personService.getPlayersByClubId(this.division.clubId).subscribe({
        next: (persons) => {
          this.allPlayers = persons;
          this.mostrarFormularioAsociacion = true;
        },
        error: (err) => {
          console.error('Error al cargar personas del club', err);
          this.mensajeError = 'No se pudieron obtener las personas del club.';
        }
      });
    }

    crearAsociacion(personId: string, position: string, jerseyNumber?: number): void {
      if (!personId || !position) {
        this.mensajeError = 'Por favor selecciona una persona y define una posición.';
        return;
      }

      const creationDto = {
        divisionId: this.division?.id,
        personId,
        position,
        jerseyNumber
      };

      this.mensajeError = '';

      this.divisionPlayerService.registerPlayer(creationDto).subscribe({
        next: () => {
          this.cargarJugadoresActivos();
        },
        error: (err) => {
          console.error('Error al asociar jugador a la división', err);
          this.mensajeError = typeof err.error === 'string'
            ? err.error
            : (err.error?.message || 'Ocurrió un conflicto o error al crear la asociación.');
        }
      });
    }

    mostrarAsociaciones(player: DivisionPlayerResponse): void {
      const divisionId = this.division?.id;
      if (!divisionId) {
        this.mensajeError = 'No se pudo obtener el historial del jugador porque la división no está disponible.';
        return;
      }

      this.playerHistory = [];
      this.divisionPlayerService.getByDivisionIdAndPersonId(divisionId, player.personId).subscribe({
        next: (history) => {
          this.playerHistory = history;
        },
        error: (err) => {
          console.error('Error al cargar el historial del jugador', err);
          this.playerHistory = [];
          this.mensajeError = typeof err.error === 'string'
            ? err.error
            : (err.error?.message || 'No se pudo cargar el historial del jugador.');
        }
      });
    }

    cargarJugadoresActivos(): void {
      this.mensajeError = '';

      this.route.paramMap.pipe(
        switchMap((params) => {
          const divisionId = params.get('divisionId');
          if (!divisionId) {
            throw new Error('No se recibió el ID de la división.');
          }

          return forkJoin({
            division: this.divisionService.getDivisionById(divisionId),
            activePlayers: this.divisionPlayerService.getActiveByDivisionId(divisionId)
          });
        }),
        switchMap(({ division, activePlayers }) => {
          if (activePlayers.length === 0) {
            return of({ division, activePlayers, activePersons: [] as PersonResponse[] });
          }

          return forkJoin(
            activePlayers.map(activePlayers => this.personService.getPersonById(activePlayers.personId))
          ).pipe(
            switchMap((activePersons) => of({ division, activePlayers, activePersons }))
          );
        })
      ).subscribe({
        next: ({ division, activePlayers, activePersons }) => {
          this.division = division;
          this.activePlayers = activePlayers;
          this.activePersons = activePersons;
        },
        error: (err) => {
          console.error('Error al cargar los jugadores de la división', err);
          this.activePlayers = [];
          this.activePersons = [];
          this.mensajeError = 'No se pudieron cargar los jugadores de la división.';
        }
      });
    }

    desasociarJugador(player: DivisionPlayerResponse): void {
        this.mensajeError = '';
        this.divisionPlayerService.remove(player.id).subscribe({
            next: () => {
                this.cargarJugadoresActivos();
            },
            error: (err) => {
                console.error('Error al desasociar jugador', err);
                this.mensajeError = typeof err.error === 'string'
                ? err.error
                : (err.error?.message || 'No se pudo desasociar el jugador.');
            }
        });
    }
}