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
  
  opponent = 'Cargando...';
  timelineTracks: { eventTypeId: string, eventName: string, occurrences: number[] }[] = [];
  maxMatchDuration = 80;
  timelineTicks: number[] = [];
  eventTypesDiccionario: { [id: string]: string } = {};

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    if (this.matchId) {
      this.loadMatchDetails();
      this.loadEventTypesAndEvents();
    }
  }

  loadMatchDetails(): void {
    this.matchService.getMatchById(this.matchId).subscribe({
      next: (match) => {
        this.opponent = match.opponent || 'Visitante';
      },
      error: (err) => console.error('Error al cargar detalles del partido:', err)
    });
  }

  loadEventTypesAndEvents(): void {
    this.matchService.getEventTypes().subscribe({
      next: (types) => {
        types.forEach(type => {
          this.eventTypesDiccionario[type.id] = type.name; 
        });
        
        this.loadEvents();
      },
      error: (err) => console.error('Error al cargar tipos de evento:', err)
    });
  }

  loadEvents(): void {
    this.matchService.getEventsMatch(this.matchId).subscribe({
      next: (data) => {
        this.events = data;
        this.buildTimeline();
      },
      error: (err) => console.error('Error al traer eventos:', err)
    });
  }

  buildTimeline(): void {
    const trackMap = new Map<string, number[]>();
    
    this.events.forEach(event => {
      if (event.matchTime > this.maxMatchDuration) {
        this.maxMatchDuration = event.matchTime;
      }
      if (!trackMap.has(event.eventTypeId)) {
        trackMap.set(event.eventTypeId, []);
      }
      trackMap.get(event.eventTypeId)?.push(event.matchTime);
    });

    this.timelineTracks = [];
    trackMap.forEach((times, id) => {
      this.timelineTracks.push({
        eventTypeId: id,
        eventName: this.getEventName(id),
        occurrences: times
      });
    });

    this.timelineTicks = [];
    for (let i = 0; i <= this.maxMatchDuration; i += 5) {
      this.timelineTicks.push(i);
    }
  }

  getEventName(eventTypeId: string): string {
    return this.eventTypesDiccionario[eventTypeId] || 'Evento Desconocido';
  }
}
