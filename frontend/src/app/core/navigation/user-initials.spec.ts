import { getUserInitials } from './user-initials';

describe('getUserInitials', () => {
  it('usa nombre y apellido', () => {
    expect(getUserInitials('Sofía Álvarez', 's@x.com')).toBe('SÁ');
  });

  it('con un solo nombre usa sus dos primeras letras', () => {
    expect(getUserInitials('Sofía', 's@x.com')).toBe('SO');
  });

  it('con varios apellidos usa la primera y la última palabra', () => {
    expect(getUserInitials('Juan Pablo Pérez', 'j@x.com')).toBe('JP');
  });

  it('cae al correo cuando no hay nombre', () => {
    expect(getUserInitials('ana@club.org', 'ana@club.org')).toBe('AN');
    expect(getUserInitials('', 'zeta@club.org')).toBe('ZE');
  });
});
