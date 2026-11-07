import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatchResult } from '../../../player-statistics/types/player-statistics.types';

const RESULT_LETTER: Record<MatchResult, string> = { win: 'G', draw: 'E', loss: 'P' };
const RESULT_WORD: Record<MatchResult, string> = { win: 'Ganado', draw: 'Empatado', loss: 'Perdido' };

/** Pastilla G/E/P de un partido; el texto siempre acompaña al color. */
@Component({
  selector: 'app-result-pill',
  standalone: true,
  templateUrl: './result-pill.component.html',
  styleUrl: './result-pill.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultPillComponent {
  readonly result = input.required<MatchResult>();
  /** "24-17", opcional. */
  readonly score = input<string>('');
  /** Rival corto, opcional ("DRA"). */
  readonly opponent = input<string>('');
  /** % de análisis del partido; se resalta si es menor a 100. */
  readonly analysisPercent = input<number | null>(null);

  readonly letter = computed(() => RESULT_LETTER[this.result()]);

  readonly ariaLabel = computed(() => {
    const parts = [RESULT_WORD[this.result()]];
    if (this.score()) parts.push(this.score());
    if (this.opponent()) parts.push(`vs ${this.opponent()}`);
    const percent = this.analysisPercent();
    if (percent !== null) parts.push(`análisis ${percent} %`);
    return parts.join(' ');
  });

  readonly incomplete = computed(() => {
    const percent = this.analysisPercent();
    return percent !== null && percent < 100;
  });
}
