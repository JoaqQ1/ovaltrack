import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { UserContextService } from '../../core/services/user-context.service';
import { AuthService } from '../auth/services/auth.service';
import { UserContext, UserRole } from '../auth/types/auth.types';
import { HomeComponent } from './home.component';
import { LandingComponent } from './landing/landing.component';
import { AdminHomeComponent } from './views/admin/admin-home.component';
import { CoachHomeComponent } from './views/coach/coach-home.component';
import { OtherHomeComponent } from './views/other/other-home.component';
import { PlayerHomeComponent } from './views/player/player-home.component';

@Component({ selector: 'app-coach-home', standalone: true, template: '' })
class FakeCoachHome {}
@Component({ selector: 'app-admin-home', standalone: true, template: '' })
class FakeAdminHome {}
@Component({ selector: 'app-player-home', standalone: true, template: '' })
class FakePlayerHome {}
@Component({ selector: 'app-other-home', standalone: true, template: '' })
class FakeOtherHome {}

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  const currentUser = signal<{ id: string; email: string; role: UserRole } | null>(null);
  const userContext = signal<Pick<UserContext, 'role'> | null>(null);

  const render = (): void => fixture.detectChanges();
  const has = (selector: string): boolean => fixture.debugElement.query(By.css(selector)) !== null;

  beforeEach(async () => {
    currentUser.set(null);
    userContext.set(null);
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } },
        { provide: UserContextService, useValue: { userContext } }
      ]
    })
      .overrideComponent(HomeComponent, {
        remove: { imports: [CoachHomeComponent, AdminHomeComponent, PlayerHomeComponent, OtherHomeComponent, LandingComponent] },
        add: { imports: [FakeCoachHome, FakeAdminHome, FakePlayerHome, FakeOtherHome, LandingComponent] }
      })
      .compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
  });

  it('sin sesión muestra la landing', () => {
    render();
    expect(has('app-landing')).toBeTrue();
  });

  it('con sesión y sin contexto todavía muestra el esqueleto', () => {
    currentUser.set({ id: 'u', email: 'a@b.c', role: 'COACH_ANALYST' });
    render();
    expect(has('.home-loading')).toBeTrue();
    expect(has('app-coach-home')).toBeFalse();
  });

  const cases: [UserRole, string][] = [
    ['COACH_ANALYST', 'app-coach-home'],
    ['ADMIN_CLUB', 'app-admin-home'],
    ['PLAYER', 'app-player-home'],
    ['ADMIN_OVALTRACK', 'app-other-home'],
    ['NO_ROLE', 'app-other-home']
  ];
  for (const [role, selector] of cases) {
    it(`el rol ${role} muestra ${selector}`, () => {
      currentUser.set({ id: 'u', email: 'a@b.c', role });
      userContext.set({ role });
      render();
      expect(has(selector)).toBeTrue();
    });
  }
});
