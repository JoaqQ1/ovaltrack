import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pelota de rugby animada (girando y rebotando). Es decorativa: el texto de carga lo pone quien la usa. */
@Component({
  selector: 'app-rugby-ball',
  standalone: true,
  templateUrl: './rugby-ball.component.html',
  styleUrl: './rugby-ball.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' }
})
export class RugbyBallComponent {}
