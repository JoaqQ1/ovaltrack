import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RugbyBallComponent } from '../rugby-ball/rugby-ball.component';

/** Estado de carga en tarjeta: la pelota de rugby animada y el mensaje. */
@Component({
  selector: 'app-rugby-ball-loader',
  standalone: true,
  imports: [RugbyBallComponent],
  templateUrl: './rugby-ball-loader.component.html',
  styleUrl: './rugby-ball-loader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-busy': 'true' }
})
export class RugbyBallLoaderComponent {
  readonly message = input.required<string>();
}
