import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../services/match.service';

interface RosterSlot {
  number: number;
  positionName: string;
  player: any | null; 
}

@Component({
  selector: 'ot-selection-roster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selection-roster.component.html',
  styleUrl: './selection-roster.component.css' 
})
export class SelectionRosterComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matchService = inject(MatchService);

  matchId = '';
  currentStep: 'titulares' | 'suplentes' = 'titulares';
  
  titularesSlots: RosterSlot[] = [
    { number: 1, positionName: ' (Pilar)', player: null },
    { number: 2, positionName: ' (Hooker)', player: null },
    { number: 3, positionName: ' (Pilar)', player: null },
    { number: 4, positionName: ' (Segunda Línea)', player: null },
    { number: 5, positionName: ' (Segunda Línea)', player: null },
    { number: 6, positionName: ' (Ala)', player: null },
    { number: 7, positionName: ' (Ala)', player: null },
    { number: 8, positionName: ' (Octavo)', player: null },
    { number: 9, positionName: ' (Medio Scrum)', player: null },
    { number: 10, positionName: ' (Apertura)', player: null },
    { number: 11, positionName: ' (Wing)', player: null },
    { number: 12, positionName: ' (Primer Centro)', player: null },
    { number: 13, positionName: ' (Segundo Centro)', player: null },
    { number: 14, positionName: ' (Wing)', player: null },
    { number: 15, positionName: ' (Fullback)', player: null }
  ];

  suplentesSlots: RosterSlot[] = [
    { number: 16, positionName: ' (Suplente)', player: null },
    { number: 17, positionName: ' (Suplente)', player: null },
    { number: 18, positionName: ' (Suplente)', player: null },
    { number: 19, positionName: ' (Suplente)', player: null },
    { number: 20, positionName: ' (Suplente)', player: null },
    { number: 21, positionName: ' (Suplente)', player: null },
    { number: 22, positionName: ' (Suplente)', player: null },
    { number: 23, positionName: ' (Suplente)', player: null }
  ];

  availablePlayers: any[] = []; 
  activeSlotIndex: number | null = null;

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData();
  }

  loadData(): void {
    this.matchService.getAvailablePlayers(this.matchId).subscribe({
      next: (players) => {
        this.availablePlayers = players;
        this.loadSavedRoster();
      },
      error: (err) => {
        console.error('Error al cargar los jugadores:', err);
      }
    });
  }

  loadSavedRoster(): void {
    this.matchService.getSavedRoster(this.matchId).subscribe({
      next: (savedRoster) => {
        if (savedRoster) {
          this.populateSlots(savedRoster.startingPlayers, this.titularesSlots);
          this.populateSlots(savedRoster.substitutePlayers, this.suplentesSlots);
        }
      },
      error: (err) => {
        console.error('Error al cargar el plantel guardado:', err);
      }
    });
  }

  private populateSlots(playerIds: string[], slotsArray: RosterSlot[]): void {
    if (!playerIds || playerIds.length === 0) return;

    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const playerObj = this.availablePlayers.find(p => p.id === playerId);
      
      if (playerObj && slotsArray[i]) {
        slotsArray[i].player = playerObj;
      }
    }
  }

  private getCurrentSlotsArray(): RosterSlot[] {
    return this.currentStep === 'titulares' ? this.titularesSlots : this.suplentesSlots;
  }

  selectSlot(index: number): void {
    this.activeSlotIndex = this.activeSlotIndex === index ? null : index;
  }

  selectAvailablePlayer(player: any): void {
    if (this.activeSlotIndex !== null && !this.isPlayerAssigned(player.id)) {
      const currentSlots = this.getCurrentSlotsArray();
      currentSlots[this.activeSlotIndex].player = player;
      this.activeSlotIndex = null;
    }
  }

  clearSlot(index: number, event: Event): void {
    event.stopPropagation();
    const currentSlots = this.getCurrentSlotsArray();
    currentSlots[index].player = null;
    this.activeSlotIndex = null;
  }

  isPlayerAssigned(playerId: string): boolean {
    const inTitulares = this.titularesSlots.some(slot => slot.player?.id === playerId);
    const inSuplentes = this.suplentesSlots.some(slot => slot.player?.id === playerId);
    return inTitulares || inSuplentes;
  }

  goToSuplentes(): void {
    this.currentStep = 'suplentes';
    this.activeSlotIndex = null; 
  }
  
  goToTitulares(): void {
    this.currentStep = 'titulares';
    this.activeSlotIndex = null;
  }

  goBack(): void {
    this.router.navigate(['/match-selection']);
  }

  guardarPlantel(): void {
    const titularesIds = this.titularesSlots
      .map(slot => slot.player?.id)
      .filter((id): id is string => id != null);
      
    const suplentesIds = this.suplentesSlots
      .map(slot => slot.player?.id)
      .filter((id): id is string => id != null);

    if (titularesIds.length < 15) {
      alert(`Faltan titulares. Has asignado ${titularesIds.length}/15. No puedes iniciar el partido.`);
      this.goToTitulares(); 
      return; 
    }

    const payload = {
      matchId: this.matchId,
      startingPlayers: titularesIds,
      substitutePlayers: suplentesIds
    };

    this.matchService.saveRoster(payload).subscribe({
      next: (response) => {
        console.log('Plantel guardado con éxito', response);
        alert('¡Plantel guardado! Iniciando partido...');
        this.router.navigate(['/live-capture', this.matchId]); 
      },
      error: (err) => {
        console.error('Error al guardar el plantel:', err);
        alert('Hubo un error al intentar guardar el plantel. Intenta nuevamente.');
      }
    });
  }
}