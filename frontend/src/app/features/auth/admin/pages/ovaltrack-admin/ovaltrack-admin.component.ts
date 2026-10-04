import { Component, OnInit } from '@angular/core';
import { OvalTrackAdminService } from '../../services/ovaltrack-admin.service';
import { OvalTrackAdminOverview, RegistrationRequest } from '../../types/ovaltrack-admin.types';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService } from 'src/app/services/club.service';
import { Club } from 'src/app/features/club/types/club.types';
import { BackendResponse, STATUS_CODE } from 'src/app/shared/types/shared-types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ovaltrack-admin',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './ovaltrack-admin.component.html',
  styleUrl: './ovaltrack-admin.component.css'
})
export class OvaltrackAdminComponent implements OnInit {
  overview!: OvalTrackAdminOverview;
  errorMessage = '';
  isLoading = true;
  activeSection: string = 'new-request';
  activeClubs: Club[] = [];

  // Control de rechazos con comentarios
  rejectingId: string | null = null;
  rejectComment: string = '';

  constructor(
    private adminService: OvalTrackAdminService,
    private clubService: ClubService,
  ) { }

  ngOnInit(): void {
    this.loadOverview();
    this.getClubs();
  }

  loadOverview(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getOverview().subscribe({
      next: (response: BackendResponse) => {
        if (response.status === STATUS_CODE.OK) {
          console.log(response)
          this.overview = response.data as OvalTrackAdminOverview;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el panel de administración.';
        this.isLoading = false;
      }
    });
  }

  // --- ACCIONES DE SOLICITUDES ---

  onAccept(id: string): void {
    this.adminService.approveClubRequest(id).subscribe({
      next: (response: BackendResponse) => {
        if (response.status === STATUS_CODE.OK) {
          this.loadOverview();
        }
      },
      error: (err) => {
        console.error('Error al aprobar solicitud', err);
        this.errorMessage = 'No se pudo aprobar la solicitud.';
      }
    });
  }

  startReject(id: string): void {
    this.rejectingId = id;
    this.rejectComment = '';
  }

  cancelReject(): void {
    this.rejectingId = null;
    this.rejectComment = '';
  }

  confirmReject(id: string): void {
    if (!this.rejectComment.trim()) {
      this.errorMessage = 'Por favor, ingresa una razón para el rechazo.';
      return;
    }

    this.adminService.rejectClubRequest(id, this.rejectComment).subscribe({
      next: () => {
        this.cancelReject();
        this.loadOverview();
      },
      error: (err) => {
        console.error('Error al rechazar solicitud', err);
        this.errorMessage = 'No se pudo rechazar la solicitud.';
      }
    });
  }

  // Métodos específicos para dar de baja / alta cuentas o registros
  onDeactivateRegistration(id: string): void {
    // Lógica para dar de baja una solicitud aprobada
    console.log("Dando de baja la solicitud/cuenta ID:", id);
    // TODO: Llamar al servicio correspondiente (ej: this.adminService.deactivateRequest(id)...)
  }

  onActivateRegistration(id: string): void {
    // Lógica para dar de alta / reactivar una solicitud rechazada
    console.log("Dando de alta (reactivando) la solicitud ID:", id);
    this.adminService.approveClubRequest(id).subscribe({
      next: () => this.loadOverview(),
      error: (err) => console.error('Error al dar de alta', err)
    });
  }

  getClubs(): void {
    this.clubService.getClubes().subscribe({
      next: (clubs: Club[]) => {
        if (clubs) {
          this.activeClubs = clubs;
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  deactivateClub(club: Club): void {
  }
  activateClub(club: Club): void {
  }
  activateAccount(userId: string) {
    this.adminService.activateAccount(userId).subscribe({
      next: (response: BackendResponse) => {
        if (response.status === STATUS_CODE.OK) {
          this.loadOverview();
        }
      },
      error(err) {
        console.error(err);
      },
    })
  }
  deactivateAccount(userId: string) {
    console.log(userId)
    this.adminService.deactivateAccount(userId).subscribe({
      next: (response: BackendResponse) => {
        if (response.status === STATUS_CODE.OK) {
          this.loadOverview();
        }
      },
      error(err) {
        console.error(err);
      },
    })
  }


  // --- GETTERS FILTRADOS ---

  // Solicitudes pendientes de nuevos clubes
  get newRequests(): RegistrationRequest[] {
    return this.overview?.registrationRequests?.filter(
      r => (r.status === 'PENDING' || r.status === 'NEEDS_INFORMATION')
    ) || [];
  }

  // Solicitudes de Staff / Admins de club (Historial general o procesadas para poder dar de alta/baja)
  get staffRequests(): RegistrationRequest[] {
    return this.overview?.registrationRequests?.filter(
      r => r.status === 'APPROVED' || r.status === 'REJECTED'
    ) || [];
  }
}