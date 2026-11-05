import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { NavbarModeService } from './navbar-mode.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('NavbarModeService', () => {
  let router: Router;
  let service: NavbarModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: DummyComponent },
          { path: 'live-capture/:id', component: DummyComponent, data: { navbar: 'hidden' } },
          {
            path: 'post-match/:id',
            component: DummyComponent,
            data: { navbar: 'compact' },
            children: [{ path: 'zones', component: DummyComponent, data: { layout: 'wide' } }],
          },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    service = TestBed.inject(NavbarModeService);
  });

  it('usa la barra completa por defecto', async () => {
    await router.navigateByUrl('/home');
    expect(service.mode()).toBe('default');
  });

  it('oculta la barra en captura en vivo', async () => {
    await router.navigateByUrl('/live-capture/1');
    expect(service.isHidden()).toBeTrue();
  });

  it('las rutas hijas de post-partido heredan el modo compacto', async () => {
    await router.navigateByUrl('/post-match/1/zones');
    expect(service.isCompact()).toBeTrue();
  });
});
