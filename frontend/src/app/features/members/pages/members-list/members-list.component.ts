import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembersService } from '../../services/members.service';
import {
  BannerNotification,
  ClubInfo,
  FilterCategory,
  Member,
  ROLE_META,
  SELECTABLE_ROLES,
  UserRole,
  bucketOf,
  getMemberInitials
} from '../../types/members.types';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members-list.component.html',
  styleUrl: './members-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersListComponent implements OnInit {
  private readonly membersService = inject(MembersService);

  readonly ROLE_META = ROLE_META;
  readonly SELECTABLE_ROLES = SELECTABLE_ROLES;
  readonly getMemberInitials = getMemberInitials;

  readonly filterDefs: Array<{
    key: FilterCategory;
    label: string;
    dot?: string;
    dashed?: boolean;
  }> = [
    { key: 'ALL', label: 'Todos' },
    { key: 'STAFF', label: 'Staff / Coaches', dot: 'var(--navy)' },
    { key: 'PLAYER', label: 'Jugadores', dot: 'var(--player)' },
    { key: 'NO_ROLE', label: 'Sin asignar', dashed: true }
  ];

  // State Signals
  readonly members = signal<Member[]>([]);
  readonly initialRoles = signal<Map<string, UserRole>>(new Map());
  readonly dirtyMembers = signal<Set<string>>(new Set());
  readonly searchQuery = signal<string>('');
  readonly activeFilter = signal<FilterCategory>('ALL');
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly banners = signal<BannerNotification[]>([]);
  readonly openMenu = signal<{ type: 'role' | 'actions'; memberId: string } | null>(null);
  readonly club = signal<ClubInfo | null>(null);

  // Computed Signals
  readonly clubName = computed(() => this.club()?.name || 'Orcas RC');
  readonly clubCrest = computed(() => {
    const name = this.clubName().trim();
    return name ? name.charAt(0).toUpperCase() : 'O';
  });

  readonly filterCounts = computed(() => {
    const counts: Record<FilterCategory, number> = {
      ALL: this.members().length,
      STAFF: 0,
      PLAYER: 0,
      NO_ROLE: 0
    };
    for (const m of this.members()) {
      const bucket = bucketOf(m.role);
      counts[bucket] = (counts[bucket] || 0) + 1;
    }
    return counts;
  });

  readonly filteredMembers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.activeFilter();
    const list = this.members();

    return list.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const jerseyStr = m.jersey != null ? `#${m.jersey}` : '';
      const textToSearch = `${fullName} ${email} ${jerseyStr}`;

      const matchesQuery = !query || textToSearch.includes(query);
      const matchesFilter = filter === 'ALL' || bucketOf(m.role) === filter;

      return matchesQuery && matchesFilter;
    });
  });

  readonly dirtyCount = computed(() => this.dirtyMembers().size);
  readonly hasDirtyMembers = computed(() => this.dirtyMembers().size > 0);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.membersService.getMembers().subscribe({
      next: (data) => {
        this.members.set(data);
        this.initialRoles.set(new Map(data.map(m => [m.id, m.role])));
        this.dirtyMembers.set(new Set());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar miembros:', err);
        this.isLoading.set(false);
        this.showBanner(
          'error',
          'Error de conexión',
          'No se pudieron cargar los miembros desde el servidor. Revisa tu conexión.'
        );
      }
    });

    this.membersService.getMyClub().subscribe({
      next: (clubData) => {
        if (clubData) {
          this.club.set(clubData);
        }
      },
      error: () => {
        // En caso de error o si no tiene club asignado, se mantiene el fallback por defecto
      }
    });
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  setFilter(filter: FilterCategory): void {
    this.activeFilter.set(filter);
  }

  toggleRoleMenu(memberId: string, event: Event): void {
    event.stopPropagation();
    const current = this.openMenu();
    if (current && current.type === 'role' && current.memberId === memberId) {
      this.closeMenus();
    } else {
      this.openMenu.set({ type: 'role', memberId });
    }
  }

  toggleActionsMenu(memberId: string, event: Event): void {
    event.stopPropagation();
    const current = this.openMenu();
    if (current && current.type === 'actions' && current.memberId === memberId) {
      this.closeMenus();
    } else {
      this.openMenu.set({ type: 'actions', memberId });
    }
  }

  closeMenus(): void {
    this.openMenu.set(null);
  }

  selectRole(memberId: string, newRole: UserRole, event: Event): void {
    event.stopPropagation();
    const member = this.members().find(m => m.id === memberId);
    if (!member) {
      this.closeMenus();
      return;
    }

    if (member.isProtected && newRole !== member.role) {
      this.closeMenus();
      this.showBanner(
        'warning',
        'No tenés permisos suficientes',
        'Solo un Administrador de OvalTrack puede reasignar el rol de otro Administrador de club.'
      );
      return;
    }

    // Actualizar rol localmente en el signal
    const updatedList = this.members().map(m => {
      if (m.id === memberId) {
        return { ...m, role: newRole };
      }
      return m;
    });
    this.members.set(updatedList);

    // Actualizar dirty set
    const initialRole = this.initialRoles().get(memberId);
    const updatedDirty = new Set(this.dirtyMembers());
    if (newRole !== initialRole) {
      updatedDirty.add(memberId);
    } else {
      updatedDirty.delete(memberId);
    }
    this.dirtyMembers.set(updatedDirty);

    this.closeMenus();
  }

  showPermTip(role: UserRole, event: Event): void {
    event.stopPropagation();
    const meta = this.ROLE_META[role];
    if (meta && meta.perm) {
      this.showBanner(
        'info',
        `Rol deportivo vs. permiso de sistema — ${meta.label}`,
        meta.perm.tip
      );
    }
  }

  handleAction(member: Member, action: 'profile' | 'edit' | 'revoke', event: Event): void {
    event.stopPropagation();
    this.closeMenus();

    const fullName = `${member.firstName} ${member.lastName}`.trim() || member.email;

    if (action === 'revoke') {
      this.showBanner(
        'warning',
        `Revocar acceso — ${fullName}`,
        'Esta acción eliminaría su acceso al sistema (fuera del alcance de esta maqueta).'
      );
    } else if (action === 'profile') {
      this.showBanner(
        'info',
        'Ver perfil',
        `Esta acción abriría la ficha completa de ${fullName} (fuera del alcance de esta maqueta).`
      );
    } else if (action === 'edit') {
      this.showBanner(
        'info',
        'Editar ficha',
        `Esta acción abriría la edición de datos de ${fullName} (fuera del alcance de esta maqueta).`
      );
    }
  }

  onInviteClick(): void {
    this.showBanner(
      'info',
      'Invitar miembro',
      'Esta acción abriría el flujo de invitación por email (fuera del alcance de esta maqueta).'
    );
  }

  discardChanges(): void {
    const initial = this.initialRoles();
    const revertedList = this.members().map(m => {
      const originalRole = initial.get(m.id);
      return originalRole ? { ...m, role: originalRole } : m;
    });
    this.members.set(revertedList);
    this.dirtyMembers.set(new Set());
  }

  saveAllChanges(): void {
    const dirtyIds = Array.from(this.dirtyMembers());
    if (dirtyIds.length === 0 || this.isSaving()) {
      return;
    }

    const updates = dirtyIds.map(id => ({
      userId: id,
      newRole: this.members().find(m => m.id === id)!.role
    }));

    this.isSaving.set(true);

    this.membersService.updateBatchRoles(updates).subscribe({
      next: () => {
        // Actualizar roles base
        const updatedInitial = new Map(this.initialRoles());
        for (const update of updates) {
          updatedInitial.set(update.userId, update.newRole);
        }
        this.initialRoles.set(updatedInitial);
        this.dirtyMembers.set(new Set());
        this.isSaving.set(false);

        const n = updates.length;
        this.showBanner(
          'success',
          'Cambios guardados',
          `Se actualizaron ${n} rol${n > 1 ? 'es' : ''} correctamente.`
        );
      },
      error: (err) => {
        console.error('Error al guardar roles:', err);
        this.isSaving.set(false);
        const errMsg = err?.error?.message || 'Hubo un problema al guardar los cambios en el servidor.';
        this.showBanner('error', 'No se pudo guardar el cambio', errMsg);
      }
    });
  }

  showBanner(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    const newBanner: BannerNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message
    };
    // Reemplaza o apila según sea necesario
    this.banners.set([newBanner]);
  }

  removeBanner(id: string): void {
    this.banners.set(this.banners().filter(b => b.id !== id));
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenus();
  }
}
