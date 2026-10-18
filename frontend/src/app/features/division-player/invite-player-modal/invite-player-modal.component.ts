import { Component, EventEmitter, HostListener, Input, OnInit, Output, signal } from '@angular/core';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ResultsPage } from '../../pagination/results-page';
import { PersonService } from 'src/app/services/person.service';
import { Division } from '../../division/types/division.types';
import { InvitationService } from '../../invitation/service/invitation.service';
import { BackendResponse, STATUS_CODE } from 'src/app/shared/types/shared-types';
import { ToastService } from 'src/app/core/services/toast.service';


@Component({
  selector: 'app-invite-player-modal',
  standalone: true,
  imports: [PaginationComponent],
  templateUrl: './invite-player-modal.component.html',
  styleUrl: './invite-player-modal.component.css',
})
export class InvitePlayerModalComponent implements OnInit {
  /** Jugadores disponibles para invitar. */
  resultsPage: ResultsPage = {
    content: [],
    totalPages: 1,
    totalElements: 1,
    last: false,
    first: true,
    numberOfElements: 1,
    size: 1,
    number: 1
  };

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
    private personService: PersonService,
    private invitationService: InvitationService,
    private toastService: ToastService
  ) { }

  cargarJugadoresDisponibles(page: number): void {
    if (!this.division?.clubId) {
      return;
    }

    this.currentPage = page;
    this.personService.findAllPlayersByDivision( this.division.id, page, 10).subscribe({
      next: (response: ResultsPage) => {
        this.resultsPage = response;
      },
      error: (err) => {
        this.toastService.error('error', err.message);
        this.close();
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
    const player = this.resultsPage.content.find((p) => p.id === this.selectedId());
    const payload = {
      divisionId: this.division?.id,
      personId: player.id
    }
    this.invitationService.sendInvitation(payload).subscribe({
      next: (response: BackendResponse) => {
        if (response.status !== STATUS_CODE.OK)
          this.toastService.error(response.message,'Error');
        this.toastService.success(response.message, 'Invitacion enviada con exito', 2000);
        this.close();
      },
      error: (error) => {
        console.log(error)
        this.toastService.error(error.error.message,'Error',3000);
        this.close();
      }
    });
    if (player && !this.sending) this.invited.emit(player);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }


}