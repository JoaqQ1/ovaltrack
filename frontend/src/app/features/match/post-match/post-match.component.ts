import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from '../services/match.service';

@Component({
  selector: 'app-post-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.css'
})
export class PostMatchComponent implements OnInit{
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService)

  matchId = '';
  events: any[] = [];

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.matchId) {
      this.loadEvents();
    }
  }

  loadEvents(): void {
    this.matchService.getEventsMatch(this.matchId).subscribe({
      next: (data) => {
        this.events = data;
        console.log('Eventos traídos del backend:', this.events);
      },
      error: (err) => console.error('Error al traer eventos:', err)
    });
  }
}
