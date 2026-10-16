import { Component, EventEmitter, HostListener, Input, OnInit, Output, signal } from '@angular/core';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ResultsPage } from '../../pagination/results-page';
import { PersonService } from 'src/app/services/person.service';
import { Division } from '../../division/types/division.types';


@Component({
  selector: 'app-invite-player-modal',
  standalone: true,
  imports: [PaginationComponent],
  templateUrl: './invite-player-modal.component.html',
  styleUrl: './invite-player-modal.component.css',
})
export class InvitePlayerModalComponent implements OnInit {
  /** Jugadores disponibles para invitar. */
  resultsPage!: ResultsPage;

  currentPage: number = 1;
  /** Deshabilita el envío y muestra "Enviando…" mientras se procesa la solicitud. */
  @Input() sending = false;

  @Input() division: Division | null = null;

  /** Se emite al cerrar el modal (X, Cancelar, backdrop o Escape). */
  @Output() closed = new EventEmitter<void>();
  /** Se emite con el jugador elegido al pulsar "Enviar solicitud". */
  @Output() invited = new EventEmitter<any>();

  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);

  constructor(
    private personService: PersonService
  ) { }

  cargarJugadoresDisponibles(page: number): void {
    if (!this.division?.clubId) {
      // this.mensajeError = 'No se pudo obtener los jugadores del club porque el ID del club no está disponible.';
      return;
    }

    this.currentPage = page;
    this.personService.getPagedInactivePlayersByClubAndDivision(this.division.clubId, this.division.id, page, 10).subscribe({
      next: (response: ResultsPage) => {
        this.resultsPage = response;
        console.log(this.resultsPage)
        // this.mostrarFormularioAsociacion = true;
      },
      error: (err) => {
        console.error('Error al cargar personas del club', err);
        // this.mensajeError = 'No se pudieron obtener las personas del club.';
      }
    });
  }
  onPageChangeRequested(page: number): void {
    this.cargarJugadoresDisponibles(page);
  }

  ngOnInit(): void {
    this.cargarJugadoresDisponibles(1);
  }

  get filteredPlayers(): any[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.resultsPage.content;
    return this.resultsPage.content.filter(
      (p) => p.firstName.toLowerCase().includes(q) || p.contactEmail.toLowerCase().includes(q),
    );
  }

  get canSend(): boolean {
    return !!this.selectedId() && !this.sending;
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  select(player: any): void {
    this.selectedId.set(player.id);
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  send(): void {
    // Enviar invitacion al jugador
    
    const player = this.resultsPage.content.find((p) => p.id === this.selectedId());
    if (player && !this.sending) this.invited.emit(player);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }

  
}