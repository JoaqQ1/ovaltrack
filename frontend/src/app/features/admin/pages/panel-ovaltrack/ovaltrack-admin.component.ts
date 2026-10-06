import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { OvalTrackAdminService } from '../../services/ovaltrack-admin.service';
import { UserRole } from 'src/app/features/auth/types/auth.types';
import { ClubStatus } from 'src/app/features/club/types/club.types';
import { Club } from 'src/app/features/club/types/club.types'; // Ajusta la ruta real de tus interfaces
import { User, UserResponseDTO } from 'src/app/features/user/types/user.types';
import { UserClubRegistration } from '../../types/ovaltrack-admin.types';
import { DatePipe } from '@angular/common';
import { BackendResponse, STATUS_CODE } from 'src/app/shared/types/shared-types';

export type AccountFilter = 'all' | 'active' | 'inactive';
export type ClubFilter = 'all' | 'active' | 'rejected';

@Component({
  selector: 'app-ovaltrack-admin',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './ovaltrack-admin.component.html',
  styleUrl: './ovaltrack-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OvaltrackAdminComponent implements OnInit {
  private readonly adminService = inject(OvalTrackAdminService);
  private readonly destroyRef = inject(DestroyRef);

  /* ---------- Datos reales (User[] y Club[]) ---------- */
  readonly requests = signal<UserClubRegistration[]>([]);
  readonly pendingClubs = signal<Club[]>([]);
  readonly allAccounts = signal<UserClubRegistration[]>([]);
  readonly visibleAccounts = signal<UserClubRegistration[]>([]);
  readonly allClubs = signal<Club[]>([]);
  readonly visibleClubs = signal<Club[]>([]);

  /** Administradores disponibles para asociar a un club. */
  readonly admins = computed<UserClubRegistration[]>(() => [
    ...this.allAccounts().filter((a) => a.user.role === 'ADMIN_CLUB'),
    ...this.requests().filter((r) => r.user.role === 'ADMIN_CLUB'),
  ]);

  /* ---------- Estado de UI ---------- */
  readonly accountFilter = signal<AccountFilter>('all');
  readonly clubFilter = signal<ClubFilter>('all');
  readonly accountSearch = signal('');
  readonly clubSearch = signal('');
  readonly error = signal('');

  private readonly pendingCalls = signal(0);
  readonly loading = computed(() => this.pendingCalls() > 0);

  /** Admin elegido para cada club pendiente (clubId -> adminUserId). */
  readonly selectedAdmin = signal<Record<string, string | null>>({});
  readonly openDropdown = signal<string | null>(null);

  readonly changingClubId = signal<string | null>(null);
  readonly newAdminId = signal<string | null>(null);

  /* ---------- Derivados ---------- */
  readonly stats = computed(() => ({
    pendingRequests: this.requests().length,
    pendingClubs: this.pendingClubs().length,
    activeAccounts: this.allAccounts().filter((a) => a.user.active).length,
    activeClubs: this.allClubs().filter((c) => c.status === 'ACTIVE').length,
  }));

  readonly accountCounts = computed(() => {
    const all = this.allAccounts();
    const active = all.filter((a) => a.user.active).length;
    return { all: all.length, active, inactive: all.length - active };
  });

  readonly clubCounts = computed(() => {
    const all = this.allClubs();
    const active = all.filter((c) => c.status === 'ACTIVE').length;
    return { all: all.length, active, rejected: all.length - active };
  });

  readonly filteredAccounts = computed(() => {
    const q = this.accountSearch().trim().toLowerCase();
    return this.visibleAccounts().filter(
      (a) => !q || this.userName(a.user).toLowerCase().includes(q) || a.user.email.toLowerCase().includes(q),
    );
  });

  readonly filteredClubs = computed(() => {
    const q = this.clubSearch().trim().toLowerCase();
    return this.visibleClubs().filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q),
    );
  });

  readonly changingClub = computed(() => this.visibleClubs().find((c) => c.id === this.changingClubId()) ?? null);

  ngOnInit(): void {
    this.loadAll();
  }

  /* ---------- Helpers visuales para User ---------- */
  userName(u: UserResponseDTO): string {
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
  }

  formatDate(iso?: string | null): string {
    return iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  }

  /* ---------- Carga de datos (GET) ---------- */
  loadAll(): void {
    this.error.set('');
    this.accountFilter.set('all');
    this.clubFilter.set('all');
    this.begin();

    forkJoin({
      pendingUsers: this.adminService.getPendingUsers(),
      pendingClubs: this.adminService.getPendingClubs(),
      users: this.adminService.getUsers(),
      clubs: this.adminService.getClubs(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ pendingUsers, pendingClubs, users, clubs }) => {
          const pClubs = (pendingClubs.data ?? []) as Club[];
          const uList = (users.data ?? []) as UserClubRegistration[];
          const cList = (clubs.data ?? []) as Club[];

          this.requests.set((pendingUsers.data ?? []) as UserClubRegistration[]);
          this.pendingClubs.set(pClubs);
          this.selectedAdmin.set(Object.fromEntries(pClubs.map((c) => [c.id, c.adminUserId ?? null])));
          this.allAccounts.set(uList);
          this.visibleAccounts.set(uList);
          this.allClubs.set(cList);
          this.visibleClubs.set(cList);
          this.end();
        },
        error: (err) => this.fail(err, 'No se pudieron cargar los datos del panel.'),
      });
  }

  setAccountFilter(filter: AccountFilter): void {
    this.accountFilter.set(filter);
    this.error.set('');
    this.begin();

    const active = filter === 'all' ? undefined : filter === 'active';
    this.adminService
      .getUsers(active)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (this.accountFilter() !== filter) return this.end();
          const list = (res.data ?? []) as UserClubRegistration[];
          this.visibleAccounts.set(list);
          if (filter === 'all') this.allAccounts.set(list);
          this.end();
        },
        error: (err) => this.fail(err, 'No se pudieron cargar las cuentas.'),
      });
  }

  setClubFilter(filter: ClubFilter): void {
    this.clubFilter.set(filter);
    this.error.set('');
    this.begin();

    const status = filter === 'all' ? undefined : filter === 'active' ? 'ACTIVE' : 'REJECTED';
    this.adminService
      .getClubs(status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (this.clubFilter() !== filter) return this.end();
          const list = (res.data ?? []) as Club[];
          this.visibleClubs.set(list);
          if (filter === 'all') this.allClubs.set(list);
          this.end();
        },
        error: (err) => this.fail(err, 'No se pudieron cargar los clubes.'),
      });
  }

  /* ---------- Acciones ---------- */
  approveRequest(user: UserClubRegistration): void {
    this.adminService.approveAccount(user.user.id)
      .subscribe({
        next: (response: BackendResponse) => {
          if (response.status === STATUS_CODE.OK) {
            this.loadAll();

          }
        },
        error: (error) => {
          this.fail(error, 'No se puedo aprobar la cuenta.');
        }
      })
    // this.requests.update((list) => list.filter((r) => r.user.id !== user.user.id));
    // this.updateAccounts((list) => [...list, { ...user, active: true }]);
  }

  rejectRequest(user: UserResponseDTO): void {
    this.adminService.rejectAccount(user.id)
      .subscribe({
        next: (response: BackendResponse) => {
          if (response.status === STATUS_CODE.OK) {
            this.loadAll();

          }
        },
        error: (error) => {
          this.fail(error, 'No se pudo rechazar la cuenta')
        }
      })
    // this.requests.update((list) => list.filter((r) => r.user.id !== user.id));
  }

  toggleDropdown(key: string): void {
    this.openDropdown.update((current) => (current === key ? null : key));
  }

  chooseAdminForPending(clubId: string, adminUserId: string): void {
    this.selectedAdmin.update((map) => ({ ...map, [clubId]: adminUserId }));
    this.openDropdown.set(null);
  }

  approveClub(club: Club, adminUserId: string): void {
    if (adminUserId === null) return;
    this.adminService.approveClub(club.id, adminUserId)
      .subscribe({
        next: (response: BackendResponse) => {
          if (response.status === STATUS_CODE.OK) {
            this.loadAll();

          }
        },
        error: (error) => {
          this.fail(error, 'No se puedo aprobar el club')
        }
      })
    // const adminUserId = this.selectedAdmin()[club.id];
    // if (adminUserId == null) return;
    // this.pendingClubs.update((list) => list.filter((c) => c.id !== club.id));
    // this.updateClubs((list) => [...list, { ...club, adminUserId, status: 'ACTIVE' }]);
  }

  rejectClub(club: Club): void {
    this.pendingClubs.update((list) => list.filter((c) => c.id !== club.id));
  }

  setAccountActive(account: UserClubRegistration, active: boolean): void {
    if (active) {
      this.adminService.activateAccount(account.user.id)
        .subscribe({
          next: (response: BackendResponse) => {
            if (response.status === STATUS_CODE.OK) {
              this.loadAll();
            }
          },
          error: (err) => this.fail(err,'No se puedo activar la cuenta')
        })
    } else {
      this.adminService.deactivateAccount(account.user.id)
        .subscribe({
          next: (response: BackendResponse) => {
            if (response.status === STATUS_CODE.OK) {
              this.loadAll();
            }
          }, error: (err) => this.fail(err,'No se puedo desactivar la cuenta')
        })
    }
    // this.updateAccounts((list) => list.map((a) => (a.user.id === account.user.id ? { ...a, active } : a)));
  }

  setClubStatus(club: Club, status: ClubStatus): void {
    this.updateClubs((list) => list.map((c) => (c.id === club.id ? { ...c, status } : c)));
  }

  openChangeAdmin(club: Club): void {
    this.changingClubId.set(club.id);
    this.newAdminId.set(club.adminUserId ?? null);
  }

  closeChangeAdmin(): void {
    this.changingClubId.set(null);
    this.newAdminId.set(null);
  }

  confirmChangeAdmin(): void {
    const clubId = this.changingClubId();
    const adminUserId = this.newAdminId();
    if (clubId == null || adminUserId == null) return;
    this.updateClubs((list) => list.map((c) => (c.id === clubId ? { ...c, adminUserId } : c)));
    this.closeChangeAdmin();
  }

  /* ---------- Helpers de plantilla ---------- */
  adminById(id: string | null | undefined): UserClubRegistration | undefined {
    return this.admins().find((a) => a.user.id === id);
  }

  initials(name: string): string {

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  roleClass(role: UserRole): string {
    return role === 'ADMIN_CLUB' ? 'role-admin' : role === 'COACH_ANALYST' ? 'role-coach' : 'role-player';
  }

  onSearch(target: 'account' | 'club', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    (target === 'account' ? this.accountSearch : this.clubSearch).set(value);
  }

  /* ---------- Internos ---------- */
  private updateAccounts(fn: (list: UserClubRegistration[]) => UserClubRegistration[]): void {
    const filter = this.accountFilter();
    this.allAccounts.update(fn);
    this.visibleAccounts.update((list) =>
      fn(list).filter((a) => filter === 'all' || (filter === 'active' ? a.user.active : !a.user.active)),
    );
  }

  private updateClubs(fn: (list: Club[]) => Club[]): void {
    const filter = this.clubFilter();
    this.allClubs.update(fn);
    this.visibleClubs.update((list) =>
      fn(list).filter((c) => filter === 'all' || (filter === 'active' ? c.status === 'ACTIVE' : c.status === 'REJECTED')),
    );
  }

  private begin(): void {
    this.pendingCalls.update((n) => n + 1);
  }

  private end(): void {
    this.pendingCalls.update((n) => Math.max(0, n - 1));
  }

  private fail(err: { error?: { message?: string } }, fallback: string): void {
    this.error.set(err?.error?.message ?? fallback);
    this.end();
  }
}