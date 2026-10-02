import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { OvalTrackAdminService } from '../../services/ovaltrack-admin.service';
import { OvalTrackAdminOverview } from '../../types/ovaltrack-admin.types';

type OverviewSection = 'requests' | 'accounts';

@Component({
  selector: 'app-ovaltrack-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ovaltrack-admin.component.html',
  styleUrl: './ovaltrack-admin.component.css'
})
export class OvalTrackAdminComponent implements OnInit {
  private readonly adminService = inject(OvalTrackAdminService);

  overview: OvalTrackAdminOverview | null = null;
  selectedSection: OverviewSection = 'requests';
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getOverview().subscribe({
      next: overview => {
        this.overview = overview;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el panel. Inténtalo nuevamente.';
        this.isLoading = false;
      }
    });
  }

  showRequests(): void {
    this.selectedSection = 'requests';
  }

  showAccounts(): void {
    this.selectedSection = 'accounts';
  }
}