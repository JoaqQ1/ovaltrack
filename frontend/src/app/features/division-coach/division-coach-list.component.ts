import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { DivisionService } from 'src/app/services/division.service';
import { DivisionCoachService } from 'src/app/services/division-coach.service';
import { MembersService } from '../members/services/members.service';
import { Division } from '../division/types/division.types';
import { DivisionCoachResponse } from './types/division-coach.types';
import { Member } from '../members/types/members.types';
import { PersonResponse } from '../person/types/person.types';
import { PersonService } from 'src/app/services/person.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-division-coach-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './division-coach-list.component.html',
  styleUrl: './division-coach-list.component.css'
})
export class DivisionCoachListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly divisionService = inject(DivisionService);
  private readonly divisionCoachService = inject(DivisionCoachService);
  private readonly membersService = inject(MembersService);
  private readonly personService = inject(PersonService);
  private readonly userContextService = inject(UserContextService);
  
  division: Division | null = null;
  coaches: DivisionCoachResponse[] = [];
  persons: PersonResponse[] = [];
  availableCoaches: Member[] = [];
  coachForm!: FormGroup;
  mostrarFormulario = false;
  guardando = false;
  eliminandoId: string | null = null;
  cargando = true;
  cargandoMiembros = false;
  error = '';
  mensajeError = '';

  ngOnInit(): void {
    this.coachForm = this.fb.group({
      personId: ['', Validators.required]
    });
    this.cargarEntrenadores();
  }

  get esCoach(): boolean {
    return this.userContextService.currentRole() === 'COACH_ANALYST';
  }

  mostrarAsociacion(): void {
    this.mensajeError = '';
    this.availableCoaches = [];
    this.cargandoMiembros = true;

    this.membersService.getMembers().subscribe({
      next: (members) => {
        this.availableCoaches = members.filter(member => member.role === 'COACH_ANALYST');
        this.mostrarFormulario = true;
        this.cargandoMiembros = false;
      },
      error: (err) => {
        console.error('Error al cargar los usuarios disponibles', err);
        this.cargandoMiembros = false;
        this.mensajeError = 'No se pudieron cargar los entrenadores disponibles.';
      }
    });
  }

  cancelarAsociacion(): void {
    this.mostrarFormulario = false;
    this.coachForm.reset({ personId: '' });
  }

  guardarEntrenador(): void {
    const divisionId = this.division?.id;
    if (!divisionId || this.coachForm.invalid) {
      this.coachForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.divisionCoachService.create({
      divisionId,
      personId: this.coachForm.value.personId
    }).subscribe({
      next: () => {
        this.mostrarFormulario = false;
        this.coachForm.reset({ personId: '' });
        this.guardando = false;
        this.cargarEntrenadores();
      },
      error: (err) => {
        console.error('Error al asociar entrenador', err);
        this.mensajeError = typeof err.error === 'string'
          ? err.error
          : (err.error?.message || 'No se pudo asociar el entrenador a la división.');
        this.guardando = false;
      }
    });
  }

  desasociarEntrenador(coach: DivisionCoachResponse): void {
    if (coach.endDate || this.eliminandoId || !window.confirm('¿Desasociar este entrenador de la división?')) {
      return;
    }

    this.eliminandoId = coach.id;
    this.mensajeError = '';
    this.divisionCoachService.remove(coach.id).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargarEntrenadores();
      },
      error: (err) => {
        console.error('Error al desasociar entrenador', err);
        this.eliminandoId = null;
        this.mensajeError = typeof err.error === 'string'
          ? err.error
          : (err.error?.message || 'No se pudo desasociar el entrenador.');
      }
    });
  }

  cargarEntrenadores(): void {
    this.cargando = true;
    this.error = '';

    this.route.paramMap.pipe(
      switchMap((params) => {
        const divisionId = params.get('divisionId');
        if (!divisionId) {
          throw new Error('No se recibió el ID de la división.');
        }

        return forkJoin({
          division: this.divisionService.getDivisionById(divisionId),
          coaches: this.divisionCoachService.getByDivisionId(divisionId)
        });
      }),
      switchMap(({ division, coaches }) => {
        if (coaches.length === 0) {
          return of({ division, coaches, persons: [] as PersonResponse[] });
        }

        return forkJoin(
          coaches.map(coach => this.personService.getPersonById(coach.personId))
        ).pipe(
          switchMap((persons) => of({ division, coaches, persons }))
        );
      })
    ).subscribe({
      next: ({ division, coaches, persons }) => {
        this.division = division;
        this.coaches = coaches;
        this.persons = persons;
        this.availableCoaches = [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar los entrenadores de la división', err);
        this.cargando = false;
        this.persons = [];
        this.availableCoaches = [];

        if (err.status === 403) {
          const msg = typeof err.error === 'string'
            ? err.error
            : (err.error?.message || 'Acceso denegado: no tienes permisos para acceder a esta división.');
          this.router.navigate(['/divisions'], {
            state: { errorMessage: msg, errorTitle: 'Acceso denegado' }
          });
          return;
        }

        if (err.status === 404) {
          this.router.navigate(['/divisions'], {
            state: { errorMessage: 'División no encontrada.', errorTitle: 'No encontrado' }
          });
          return;
        }

        this.error = 'No se pudieron cargar los entrenadores de la división.';
      }
    });
  }

  closeError(): void {
    this.error = '';
    this.mensajeError = '';
  }

  getCoachName(coach: DivisionCoachResponse): string {
    const person = this.persons.find(candidate => candidate.id === coach.personId);
    return person
      ? `${person.firstName} ${person.lastName}`.trim()
      : 'Persona sin nombre disponible';
  }

  getCoachEmail(coach: DivisionCoachResponse): string {
    return this.persons.find(candidate => candidate.id === coach.personId)?.contactEmail || coach.personId;
  }

  getCoachPhone(coach: DivisionCoachResponse): string {
    return this.persons.find(candidate => candidate.id === coach.personId)?.contactPhone || 'Sin teléfono';
  }

  formatDate(date: string | null): string {
    if (!date) {
      return 'Actualidad';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${date}T00:00:00`));
  }
}
