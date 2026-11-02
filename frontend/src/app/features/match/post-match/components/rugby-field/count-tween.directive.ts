import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { formatEventCount } from '../../utils/zone-grid';
import { ZONE_MOTION_MS, prefersReducedMotion, tweenValue } from '../../utils/zone-motion';

/**
 * Muestra un conteo y, cuando cambia, lo anima del valor anterior al nuevo (≤ 250 ms). La primera vez se pinta
 * directo y con `prefers-reduced-motion` nunca anima. El número exacto sigue en el aria-label de la celda.
 */
@Directive({ selector: '[appCountTween]', standalone: true })
export class CountTweenDirective implements OnChanges, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private frame: number | null = null;
  private shown: number | null = null;

  @Input({ required: true }) appCountTween = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['appCountTween']) return;

    const target = this.appCountTween;
    const from = this.shown;
    this.cancel();

    if (from === null || from === target || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
      this.render(target);
      return;
    }

    const start = performance.now();
    const step = (now: number): void => {
      const progress = (now - start) / ZONE_MOTION_MS;
      this.render(tweenValue(from, target, progress));
      this.frame = progress < 1 ? requestAnimationFrame(step) : null;
    };
    this.frame = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  private render(value: number): void {
    this.shown = value;
    this.element.nativeElement.textContent = formatEventCount(value);
  }

  private cancel(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }
}
