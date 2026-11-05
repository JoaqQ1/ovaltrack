import { NAV_MODULES } from './navigation-modules';
import { isModuleActive } from './is-module-active';

describe('isModuleActive', () => {
  const byId = (id: string) => NAV_MODULES.find(module => module.id === id)!;

  it('Inicio solo está activo en /home (y en la raíz)', () => {
    expect(isModuleActive(byId('home'), '/home')).toBeTrue();
    expect(isModuleActive(byId('home'), '/')).toBeTrue();
    expect(isModuleActive(byId('home'), '/club')).toBeFalse();
  });

  it('ignora query params y fragmentos', () => {
    expect(isModuleActive(byId('club'), '/club?tab=1#x')).toBeTrue();
  });

  it('Partidos también está activo en roster y post-partido', () => {
    expect(isModuleActive(byId('matches'), '/match-selection')).toBeTrue();
    expect(isModuleActive(byId('matches'), '/selection-roster/9')).toBeTrue();
    expect(isModuleActive(byId('matches'), '/post-match/9/zones')).toBeTrue();
  });

  it('Divisiones cubre sus subrutas pero no prefijos parecidos', () => {
    expect(isModuleActive(byId('divisions'), '/divisions/3/players')).toBeTrue();
    expect(isModuleActive(byId('divisions'), '/divisionsX')).toBeFalse();
  });

  it('un módulo sin ruta nunca está activo', () => {
    expect(isModuleActive(byId('reports'), '/home')).toBeFalse();
  });
});
