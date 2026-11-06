import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map, merge } from 'rxjs';

/** Estado de conexión del navegador como señal (eventos `online` / `offline`). */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly online = toSignal(
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    ),
    { initialValue: navigator.onLine },
  );
}
