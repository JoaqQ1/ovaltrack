import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatchService } from '../services/match.service';
import { RosterService } from '../services/roster.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Match } from '../types/match.types';
import { AvailablePlayer, RosterPayload, RosterSlot, RosterStep, SavedRoster } from '../types/roster.types';
import { createInitialStartingSlots, createInitialSubstituteSlots } from '../data/match.constants';

@Component({
  selector: 'ot-selection-roster',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './selection-roster.component.html',
  styleUrl: './selection-roster.component.css'
})
export class SelectionRosterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchService = inject(MatchService);
  private readonly rosterService = inject(RosterService);
  private readonly toastService = inject(ToastService);

  readonly matchId = signal<string>('');
  readonly match = signal<Match | null>(null);
  readonly currentStep = signal<RosterStep>('titulares');

  readonly startingSlots = signal<RosterSlot[]>(createInitialStartingSlots());
  readonly substituteSlots = signal<RosterSlot[]>(createInitialSubstituteSlots());
  readonly availablePlayers = signal<AvailablePlayer[]>([]);

  readonly activeSlotIndex = signal<number | null>(null);
  readonly searchTerm = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);

  // Computeds
  readonly startingAssignedCount = computed(() =>
    this.startingSlots().filter(slot => slot.player !== null).length
  );

  readonly substituteAssignedCount = computed(() =>
    this.substituteSlots().filter(slot => slot.player !== null).length
  );

  readonly isStartingComplete = computed(() =>
    this.startingAssignedCount() === 15
  );

  readonly currentSlots = computed(() =>
    this.currentStep() === 'titulares' ? this.startingSlots() : this.substituteSlots()
  );

  readonly assignedPlayerMap = computed(() => {
    const map = new Map<string, number>();
    this.startingSlots().forEach(slot => {
      if (slot.player) map.set(slot.player.id, slot.number);
    });
    this.substituteSlots().forEach(slot => {
      if (slot.player) map.set(slot.player.id, slot.number);
    });
    return map;
  });

  readonly filteredAvailablePlayers = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const players = this.availablePlayers();
    if (!query) return players;
    return players.filter(p =>
      p.fullName.toLowerCase().includes(query) ||
      (p.position && p.position.toLowerCase().includes(query)) ||
      (p.jerseyNumber !== null && p.jerseyNumber.toString().includes(query))
    );
  });

  readonly opponentName = computed(() => this.match()?.opponent || 'Rival');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.matchId.set(id);
    if (id) {
      this.loadAllData(id);
    } else {
      this.toastService.error('Identificador de partido no válido');
      this.router.navigate(['/match-selection']);
    }
  }

  loadAllData(matchId: string): void {
    this.isLoading.set(true);

    forkJoin({
      match: this.matchService.getMatchById(matchId),
      players: this.rosterService.getAvailablePlayers(matchId),
      savedRoster: this.rosterService.getSavedRoster(matchId)
    }).subscribe({
      next: ({ match, players, savedRoster }) => {
        this.match.set(match);
        this.availablePlayers.set(players || []);

        if (savedRoster) {
          this.applySavedRoster(savedRoster, players || []);
        } else {
          // Pre-seleccionar primera casilla titular
          this.autoSelectFirstEmptySlot('titulares', this.startingSlots());
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos del plantel:', err);
        this.toastService.error('No se pudo cargar la información del partido o jugadores.');
        this.isLoading.set(false);
      }
    });
  }

  private applySavedRoster(savedRoster: SavedRoster, players: AvailablePlayer[]): void {
    const starting = createInitialStartingSlots();
    const subs = createInitialSubstituteSlots();

    savedRoster.startingPlayers.forEach((playerId, index) => {
      if (starting[index]) {
        const found = players.find(p => p.id === playerId);
        if (found) {
          starting[index].player = found;
        }
      }
    });

    savedRoster.substitutePlayers.forEach((playerId, index) => {
      if (subs[index]) {
        const found = players.find(p => p.id === playerId);
        if (found) {
          subs[index].player = found;
        }
      }
    });

    this.startingSlots.set(starting);
    this.substituteSlots.set(subs);

    // Auto-seleccionar primer puesto libre
    const firstEmptyStarting = starting.findIndex(s => s.player === null);
    if (firstEmptyStarting !== -1) {
      this.currentStep.set('titulares');
      this.activeSlotIndex.set(firstEmptyStarting);
    } else {
      const firstEmptySub = subs.findIndex(s => s.player === null);
      if (firstEmptySub !== -1) {
        this.currentStep.set('suplentes');
        this.activeSlotIndex.set(firstEmptySub);
      }
    }
  }

  setStep(step: RosterStep): void {
    this.currentStep.set(step);
    const slots = step === 'titulares' ? this.startingSlots() : this.substituteSlots();
    this.autoSelectFirstEmptySlot(step, slots);
  }

  private autoSelectFirstEmptySlot(step: RosterStep, slots: RosterSlot[]): void {
    const firstEmpty = slots.findIndex(s => s.player === null);
    this.activeSlotIndex.set(firstEmpty !== -1 ? firstEmpty : null);
  }

  selectSlot(index: number): void {
    if (this.activeSlotIndex() === index) {
      this.activeSlotIndex.set(null);
    } else {
      this.activeSlotIndex.set(index);
    }
  }

  selectAvailablePlayer(player: AvailablePlayer): void {
    if (this.isPlayerAssigned(player.id)) {
      const assignedSlot = this.assignedPlayerMap().get(player.id);
      this.toastService.info(`${player.fullName} ya está asignado en la camiseta #${assignedSlot}`);
      return;
    }

    const currentStep = this.currentStep();
    let targetIndex = this.activeSlotIndex();
    const slots = currentStep === 'titulares' ? [...this.startingSlots()] : [...this.substituteSlots()];

    if (targetIndex === null || !slots[targetIndex]) {
      targetIndex = slots.findIndex(s => s.player === null);
    }

    if (targetIndex === -1 || !slots[targetIndex]) {
      this.toastService.warning(
        currentStep === 'titulares'
          ? 'Todos los puestos titulares están ocupados. Toca una casilla específica para reemplazar.'
          : 'Todos los puestos suplentes están ocupados.'
      );
      return;
    }

    // 1. Asignar jugador a la casilla seleccionada
    const assignedNumber = slots[targetIndex].number;
    const assignedPosition = slots[targetIndex].positionName;
    slots[targetIndex] = { ...slots[targetIndex], player };
    this.updateSlotsArray(currentStep, slots);

    // 2. Comprobar si se completaron los 15 titulares para auto-transición
    if (currentStep === 'titulares') {
      const filledStarters = slots.filter(s => s.player !== null).length;
      if (filledStarters === 15) {
        this.toastService.success(
          `Asignado #${assignedNumber} (${assignedPosition}): ${player.fullName}. ¡15 Titulares completos! Pasando a suplentes...`,
          'Formación Titular'
        );
        this.setStep('suplentes');
        return;
      }
    }

    // 3. Auto-avanzar al siguiente puesto vacío (Opción A)
    const nextEmptyIndex = this.findNextEmptySlotIndex(slots, targetIndex);
    this.activeSlotIndex.set(nextEmptyIndex);

    if (currentStep === 'suplentes' && nextEmptyIndex === null) {
      this.toastService.success(
        `Asignado #${assignedNumber} (${assignedPosition}): ${player.fullName}. ¡Plantel completo!`,
        'Alineación Completa'
      );
    } else {
      this.toastService.info(
        `Asignado #${assignedNumber} (${assignedPosition}): ${player.fullName}`
      );
    }
  }

  private findNextEmptySlotIndex(slots: RosterSlot[], fromIndex: number): number | null {
    // Buscar hacia adelante desde fromIndex + 1
    for (let i = fromIndex + 1; i < slots.length; i++) {
      if (slots[i].player === null) {
        return i;
      }
    }
    // Si no se encuentra hacia adelante, buscar desde el principio (ciclo)
    for (let i = 0; i < fromIndex; i++) {
      if (slots[i].player === null) {
        return i;
      }
    }
    return null;
  }

  clearSlot(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const currentStep = this.currentStep();
    const slots = currentStep === 'titulares' ? [...this.startingSlots()] : [...this.substituteSlots()];

    if (slots[index]) {
      const removedPlayerName = slots[index].player?.fullName;
      const slotNumber = slots[index].number;
      const slotPosition = slots[index].positionName;

      slots[index] = { ...slots[index], player: null };
      this.updateSlotsArray(currentStep, slots);

      // Opción A: dejar la casilla recién vaciada inmediatamente en foco para sustituir
      this.activeSlotIndex.set(index);

      if (removedPlayerName) {
        this.toastService.info(`Se quitó a ${removedPlayerName}. Puesto #${slotNumber} (${slotPosition}) listo para asignar.`);
      }
    }
  }

  private updateSlotsArray(step: RosterStep, newSlots: RosterSlot[]): void {
    if (step === 'titulares') {
      this.startingSlots.set(newSlots);
    } else {
      this.substituteSlots.set(newSlots);
    }
  }

  isPlayerAssigned(playerId: string): boolean {
    return this.assignedPlayerMap().has(playerId);
  }

  getPlayerDorsal(playerId: string): number | undefined {
    return this.assignedPlayerMap().get(playerId);
  }

  goBack(): void {
    this.router.navigate(['/match-selection']);
  }

  guardarPlantel(): void {
    const titularesIds = this.startingSlots()
      .map(slot => slot.player?.id)
      .filter((id): id is string => id !== undefined && id !== null);

    const suplentesIds = this.substituteSlots()
      .map(slot => slot.player?.id)
      .filter((id): id is string => id !== undefined && id !== null);

    if (titularesIds.length < 15) {
      const missing = 15 - titularesIds.length;
      this.toastService.warning(
        `Formación incompleta: has asignado ${titularesIds.length}/15 titulares. Faltan ${missing} para iniciar el partido.`,
        'Atención'
      );
      this.setStep('titulares');
      return;
    }

    this.isSaving.set(true);

    const payload: RosterPayload = {
      matchId: this.matchId(),
      startingPlayers: titularesIds,
      substitutePlayers: suplentesIds
    };

    this.rosterService.saveRoster(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('¡Plantel oficial guardado con éxito!', 'Alineación Confirmada');
        this.router.navigate(['/match-selection']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Error al guardar el plantel:', err);
        this.toastService.error('Hubo un error al intentar guardar el plantel. Intenta nuevamente.');
      }
    });
  }
}