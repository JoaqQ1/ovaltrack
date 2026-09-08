import { Component, OnInit, inject } from '@angular/core';
import {
  CategoriaEventos,
  EventoCatalogo,
  HistorialItem,
  Posesion,
} from '../types/live-capture.types';
import { LiveCaptureService } from '../services/live-capture.service';

interface LiveCaptureSnapshot {
  marcador: { local: number; visitante: number };
  relojPausado: boolean;
  posesionActual: Posesion;
  sincronizado: boolean;
  periodoLabel: string;
  categorias: CategoriaEventos[];
  historial: HistorialItem[];
}

const POSESIONES: readonly Posesion[] = ['propio', 'neutro', 'rival'] as const;

const PUNTOS_POR_EVENTO: Record<string, number> = {
  try: 5,
  'penal-palos': 3,
  'drop-gol': 3,
};

@Component({
  selector: 'ot-live-capture',
  standalone: true,
  templateUrl: './carga-en-vivo.component.html',
  styleUrl: './carga-en-vivo.component.css'
})
export class CargaEnVivoComponent implements OnInit {
  private readonly liveCaptureService = inject(LiveCaptureService);

  readonly posesiones = POSESIONES;
  readonly numeracionColumna = Array.from({ length: 15 }, (_, index) => index + 1);

  equipoLocal = '';
  equipoVisitante = '';
  marcador = { local: 0, visitante: 0 };
  relojJuego = '--:--';
  periodoLabel = '';
  sincronizado = false;
  relojPausado = false;

  posesionActual: Posesion = 'propio';
  categorias: CategoriaEventos[] = [];

  historial: HistorialItem[] = [];

  private readonly undoStack: LiveCaptureSnapshot[] = [];
  private readonly historialSnapshots = new Map<string, LiveCaptureSnapshot>();
  private nextHistorialId = 0;

  ngOnInit(): void {
    this.liveCaptureService.getLiveCaptureBootstrap({
      clubId: 'club-pmrc',
      divisionId: 'division-primera',
      matchId: 'match-pmrc-drc-001',
    }).subscribe(state => {
      this.equipoLocal = state.teamLocal;
      this.equipoVisitante = state.teamVisitante;
      this.marcador = { ...state.marcador };
      this.relojJuego = state.relojJuego;
      this.periodoLabel = state.periodoLabel;
      this.sincronizado = state.sincronizado;
      this.relojPausado = state.relojPausado;
      this.posesionActual = state.posesionActual;
      this.categorias = state.categorias.map(categoria => ({
        nombre: categoria.nombre,
        eventos: categoria.eventos.map(evento => ({ ...evento })),
      }));
      this.historial = state.historial.map((item, index) => this.normalizarHistorialItem(item, index));
      this.undoStack.length = 0;
      this.historialSnapshots.clear();
    });
  }

  get pausaLabel(): string {
    return this.relojPausado ? 'Reanudar reloj' : 'Pausar reloj';
  }

  get pausaIcon(): string {
    return this.relojPausado ? 'ti ti-player-play' : 'ti ti-player-pause';
  }

  seleccionarPosesion(posesion: Posesion): void {
    this.pushSnapshot();
    this.posesionActual = posesion;
    this.sincronizado = false;
  }

  onEventoTap(evento: EventoCatalogo): void {
    const eventId = this.crearIdHistorial();
    const snapshotAntes = this.crearSnapshot();

    this.pushSnapshot();

    this.incrementarContadorEvento(evento.id);
    this.aplicarImpactoEnMarcador(evento.id);

    if (evento.id === 'turnover') {
      this.posesionActual = this.siguientePosesion(this.posesionActual);
    }

    const nuevoItem: HistorialItem = {
      id: eventId,
      minuto: this.relojJuego,
      descripcion: this.construirDescripcionEvento(evento),
    };

    this.historialSnapshots.set(eventId, snapshotAntes);
    this.historial = [nuevoItem, ...this.historial].slice(0, 12);

    this.sincronizado = false;
  }

  deshacerUltimoEvento(): void {
    const snapshot = this.undoStack.pop();

    if (!snapshot) {
      return;
    }

    this.restaurarSnapshot(snapshot);
  }

  deshacerEventoDelHistorial(historialId: string): void {
    const snapshot = this.historialSnapshots.get(historialId);

    if (!snapshot) {
      this.historial = this.historial.filter(item => (item.id ?? `${item.minuto}-${item.descripcion}`) !== historialId);
      return;
    }

    this.historialSnapshots.delete(historialId);
    this.historial = this.historial.filter(item => (item.id ?? `${item.minuto}-${item.descripcion}`) !== historialId);
    this.restaurarSnapshot(snapshot);
  }

  eliminarEventoDelHistorial(historialId: string): void {
    this.historialSnapshots.delete(historialId);
    this.historial = this.historial.filter(item => (item.id ?? `${item.minuto}-${item.descripcion}`) !== historialId);
  }

  pausarReloj(): void {
    this.pushSnapshot();
    this.relojPausado = !this.relojPausado;
    this.sincronizado = false;
  }

  private pushSnapshot(): void {
    this.undoStack.push(this.crearSnapshot());

    if (this.undoStack.length > 20) {
      this.undoStack.shift();
    }
  }

  private crearSnapshot(): LiveCaptureSnapshot {
    return {
      marcador: { ...this.marcador },
      relojPausado: this.relojPausado,
      posesionActual: this.posesionActual,
      sincronizado: this.sincronizado,
      periodoLabel: this.periodoLabel,
      categorias: this.categorias.map(categoria => ({
        nombre: categoria.nombre,
        eventos: categoria.eventos.map(evento => ({ ...evento })),
      })),
      historial: this.historial.map(item => ({ ...item })),
    };
  }

  private normalizarHistorialItem(item: HistorialItem, index: number): HistorialItem {
    return {
      ...item,
      id: item.id ?? `hist-${index}-${item.minuto}-${item.descripcion}`,
    };
  }

  private crearIdHistorial(): string {
    this.nextHistorialId += 1;
    return `hist-${Date.now()}-${this.nextHistorialId}`;
  }

  private restaurarSnapshot(snapshot: LiveCaptureSnapshot): void {
    this.marcador = { ...snapshot.marcador };
    this.relojPausado = snapshot.relojPausado;
    this.posesionActual = snapshot.posesionActual;
    this.sincronizado = snapshot.sincronizado;
    this.periodoLabel = snapshot.periodoLabel;
    this.categorias = snapshot.categorias.map(categoria => ({
      nombre: categoria.nombre,
      eventos: categoria.eventos.map(evento => ({ ...evento })),
    }));
    this.historial = snapshot.historial.map((item, index) => this.normalizarHistorialItem(item, index));
  }

  private incrementarContadorEvento(eventoId: string): void {
    const evento = this.categorias
      .flatMap(categoria => categoria.eventos)
      .find(item => item.id === eventoId);

    if (evento) {
      evento.contador = (evento.contador ?? 0) + 1;
    }
  }

  private aplicarImpactoEnMarcador(eventoId: string): void {
    const puntos = PUNTOS_POR_EVENTO[eventoId];

    if (!puntos) {
      return;
    }

    if (this.posesionActual === 'rival') {
      this.marcador.visitante += puntos;
      return;
    }

    this.marcador.local += puntos;
  }

  private construirDescripcionEvento(evento: EventoCatalogo): string {
    const marcador = `${this.marcador.local}-${this.marcador.visitante}`;

    if (PUNTOS_POR_EVENTO[evento.id]) {
      return `${evento.nombre} — ${this.equipoEnPosesion()} ${marcador}`;
    }

    if (this.posesionActual === 'neutro') {
      return `${evento.nombre}`;
    }

    return `${evento.nombre} — ${this.equipoEnPosesion()}`;
  }

  private equipoEnPosesion(): string {
    switch (this.posesionActual) {
      case 'rival':
        return this.equipoVisitante;
      case 'neutro':
        return 'Neutro';
      case 'propio':
      default:
        return this.equipoLocal;
    }
  }

  private siguientePosesion(posesion: Posesion): Posesion {
    if (posesion === 'propio') {
      return 'rival';
    }

    if (posesion === 'rival') {
      return 'propio';
    }

    return 'propio';
  }
}
