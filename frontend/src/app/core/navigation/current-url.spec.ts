import { Component, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { injectCurrentUrl } from './current-url';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('injectCurrentUrl', () => {
  let router: Router;
  let url: Signal<string>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: DummyComponent },
          { path: 'club', component: DummyComponent },
          { path: 'inicio', redirectTo: 'home' },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    url = TestBed.runInInjectionContext(() => injectCurrentUrl());
  });

  it('arranca con la URL actual del router', () => {
    expect(url()).toBe(router.url);
  });

  it('se actualiza al terminar cada navegación', async () => {
    await router.navigateByUrl('/club?tab=1');
    expect(url()).toBe('/club?tab=1');
  });

  it('usa la URL después de las redirecciones', async () => {
    await router.navigateByUrl('/inicio');
    expect(url()).toBe('/home');
  });
});
