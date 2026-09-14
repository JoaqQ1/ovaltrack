import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClubService } from 'src/app/services/club.service';
import { DivisionService } from 'src/app/services/division.service';
import { DivisionPlayerService } from 'src/app/services/division-player.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-division-player-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './division-player-details.component.html'
})
export class DivisionPlayerDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clubService = inject(ClubService);
  private divisionService = inject(DivisionService);
  private playerService = inject(DivisionPlayerService);
  private userService = inject(UserService);

  playerDetails!: FormGroup;
  clubes: any[] = [];
  divisiones: any[] = [];
  usuarios: any[] = []; 

  ngOnInit() {
    this.iniciarFormulario();
    this.cargarClubes();
    this.cargarUsuarios();
  }

  iniciarFormulario() {
    this.playerDetails = this.fb.group({
      clubId: [''], 
      divisionId: ['', Validators.required],
      userId: ['', Validators.required],
      jerseyNumber: [''],
      position: ['']
    });
  }

  cargarClubes() {
    this.clubService.getClubes().subscribe({
      next: (data) => this.clubes = data,
      error: (err) => console.error('Error al cargar clubes', err)
    });
  }

  cargarUsuarios() {
    this.userService.getUsers().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  onClubChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const clubId = selectElement.value;
    
    this.playerDetails.get('divisionId')?.setValue('');
    this.divisiones = [];

    if (clubId) {
      this.divisionService.getDivisiones(clubId).subscribe({
        next: (data) => this.divisiones = data,
        error: (err) => console.error('Error al cargar divisiones', err)
      });
    }
  }

  guardarJugador() {
    if (this.playerDetails.valid) {
      const { divisionId, userId, jerseyNumber, position } = this.playerDetails.value;
      
      const payload = { 
        divisionId, 
        userId, 
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null, 
        position: position || null 
      };

      this.playerService.registerPlayer(payload).subscribe({
        next: (res) => {
          console.log('Jugador registrado con éxito', res);
          this.playerDetails.patchValue({ userId: '', jerseyNumber: '', position: '' });
          this.playerDetails.markAsUntouched();
        },
        error: (err) => console.error('Error al registrar jugador', err)
      });
    } else {
      this.playerDetails.markAllAsTouched();
    }
  }
}