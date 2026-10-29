import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LayoutService } from 'src/app/core/services/layout.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { MatchService } from '../../../services/match.service';
import { ZoneCellRef } from '../../../types/zone.types';
import { MatchZonesStore } from '../../store/match-zones.store';
import { RugbyFieldComponent } from '../rugby-field/rugby-field.component';
import { ZoneAssignmentPanelComponent } from '../zone-assignment-panel/zone-assignment-panel.component';

/** Pantalla de zonas de cancha: arma el layout, carga los datos y conecta la cancha con el panel. */
@Component({
  selector: 'app-post-match-zones',
  standalone: true,
  imports: [CommonModule, RugbyFieldComponent, ZoneAssignmentPanelComponent],
  templateUrl: './post-match-zones.component.html',
  styleUrl: './post-match-zones.component.css'
})
export class PostMatchZonesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly matchService = inject(MatchService);
  private readonly userContext = inject(UserContextService);
  private readonly destroyRef = inject(DestroyRef);
  readonly zonesStore = inject(MatchZonesStore);

  readonly matchId = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly opponent = signal<string>('Rival');
  readonly score = signal<{ home: number; away: number } | null>(null);
  readonly selectedCell = signal<ZoneCellRef | null>(null);
  readonly ownClubName = computed(() => this.userContext.currentClub()?.name || 'Mi Club');

  ngOnInit(): void {
    this.layoutService.setWide(true);
    this.zonesStore.reset();

    const id = this.route.snapshot.paramMap.get('id') || '';
    this.matchId.set(id);
    if (!id) {
      this.errorMessage.set('No se indicó el partido.');
      this.isLoading.set(false);
      return;
    }
    this.load(id);
  }

  ngOnDestroy(): void {
    this.layoutService.setWide(null);
    this.zonesStore.reset();
  }

  goBack(): void {
    this.router.navigate(['/post-match', this.matchId()]);
  }

  onCellSelected(cell: ZoneCellRef): void {
    this.selectedCell.set(cell);
  }

  private load(matchId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({ match: this.matchService.getMatchById(matchId), zones: this.zonesStore.load(matchId) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ match }) => {
          this.opponent.set(match.opponent || 'Rival');
          this.score.set({ home: match.homeScore ?? 0, away: match.awayScore ?? 0 });
          this.isLoading.set(false);
        },
        error: err => {
          const message = err?.error?.message;
          this.errorMessage.set(typeof message === 'string' && message ? message : 'No se pudieron cargar las zonas del partido.');
          this.isLoading.set(false);
        }
      });
  }
}
