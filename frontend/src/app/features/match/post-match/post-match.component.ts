import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchService } from '../services/match.service';
import { PersonService } from 'src/app/services/person.service';

@Component({
  selector: 'app-post-match',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-match.component.html',
  styleUrl: './post-match.component.css'
})
export class PostMatchComponent implements OnInit{

  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);
  private personService = inject(PersonService);

  matchId = '';
  events: any[] = [];
  
  opponent = 'Cargando...';
  timelineTracks: { eventTypeId: string, eventName: string, occurrences: { time: number, player: string }[], color: string }[] = [];
  maxMatchDuration = 80;
  timelineTicks: number[] = [];
  eventTypesDiccionario: { [id: string]: string } = {};
  playerNamesCache = new Map<string, string>();

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

  getEventColor(eventName: string): string {
    const nameStr = eventName.toLowerCase();
    
    if (nameStr.includes('try')) return '#57AD16'; // Verde
    if (nameStr.includes('tackle')) return '#0C2C47'; // Azul oscuro (el de tu marca)
    if (nameStr.includes('penal') || nameStr.includes('expulsión') || nameStr.includes('lesión')) return '#C6403A'; // Rojo
    if (nameStr.includes('line') || nameStr.includes('scrum') || nameStr.includes('turnover')) return '#F5821F'; // Naranja
    if (nameStr.includes('drop')) return '#9c27b0'; // Morado
    
    return '#e6c820'; // Amarillo por defecto para cualquier otro evento
  }

  buildTimeline(): void {
    const trackMap = new Map<string, { time: number, player: string, playerId: string }[]>();
    const uniquePlayerIds = new Set<string>();
    
    this.events.forEach(event => {
      if (event.matchTime > this.maxMatchDuration) {
        this.maxMatchDuration = event.matchTime;
      }
      
      if (!trackMap.has(event.eventTypeId)) {
        trackMap.set(event.eventTypeId, []);
      }
      
      if (event.playerId) {
        uniquePlayerIds.add(event.playerId); 
      }
      
      trackMap.get(event.eventTypeId)?.push({
        time: event.matchTime, 
        player: 'Cargando...',
        playerId: event.playerId
      });
    });

    this.fetchPlayerNames(uniquePlayerIds, trackMap);
  }

  fetchPlayerNames(playerIds: Set<string>, trackMap: Map<string, { time: number, player: string, playerId: string}[]>): void {
    let pendingRequests = playerIds.size;

    if (pendingRequests === 0){
      this.finalizeTimeline(trackMap);
      return;
    }
  
    playerIds.forEach(id => {
      if (this.playerNamesCache.has(id)){
        pendingRequests--;
        if (pendingRequests === 0) this.finalizeTimeline(trackMap);
        return;
      }

      this.personService.getPersonById(id).subscribe({
        next: (person) => {
          this.playerNamesCache.set(id, `${person.firstName} ${person.lastName}`);
        },
        error: () => {
          this.playerNamesCache.set(id, 'Jugador desconocido');
        },
        complete: () => {
          pendingRequests--;
          if (pendingRequests === 0) {
            this.finalizeTimeline(trackMap);
          }
        }
      });
    });
  }


  finalizeTimeline(trackMap: Map<string, { time: number, player: string, playerId: string }[]>): void {
    this.timelineTracks = [];
    trackMap.forEach((occurrences, id) => {

      const occurrencesWithNames = occurrences.map(occ => ({
        time: occ.time,
        player: occ.playerId ? (this.playerNamesCache.get(occ.playerId) || 'Desconocido') : 'Sin jugador'
      }));

      const name = this.getEventName(id);
      this.timelineTracks.push({
        eventTypeId: id,
        eventName : name,
        occurrences: occurrencesWithNames,
        color: this.getEventColor(name)
      });
    });

    this.timelineTicks = [];
    for (let i = 0; i <= this.maxMatchDuration; i += 2) {
      this.timelineTicks.push(i);
    }
  }

  getEventName(eventTypeId: string): string {
    return this.eventTypesDiccionario[eventTypeId] || 'Evento Desconocido';
  }
}
