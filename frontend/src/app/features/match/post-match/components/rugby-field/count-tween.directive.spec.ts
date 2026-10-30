import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CountTweenDirective } from './count-tween.directive';

@Component({
  standalone: true,
  imports: [CountTweenDirective],
  template: '<span data-testid="count" [appCountTween]="count"></span>'
})
class HostComponent {
  count = 4;
}

describe('CountTweenDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  const text = (): string => fixture.nativeElement.querySelector('[data-testid="count"]').textContent;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('la primera vez pinta el valor directo, sin animar', () => {
    expect(text()).toBe('4');
  });

  it('abrevia los miles igual que el resto de la cancha', () => {
    fixture.componentInstance.count = 1200;
    fixture.detectChanges();

    return new Promise<void>(resolve => setTimeout(() => {
      expect(text()).toBe('1k');
      resolve();
    }, 350));
  });

  it('al cambiar el conteo termina en el valor nuevo dentro de la duración máxima', () => {
    fixture.componentInstance.count = 9;
    fixture.detectChanges();

    return new Promise<void>(resolve => setTimeout(() => {
      expect(text()).toBe('9');
      resolve();
    }, 350));
  });
});
