import { resolveEventZoneLink } from './zone-event-link';
import { ZoneAssignmentResponse } from '../../types/zone.types';

describe('zone-event-link', () => {
  const segment = (id: string, period: 1 | 2, startMinute: number, endMinute: number, row = 2, col = 4): ZoneAssignmentResponse =>
    ({ id, matchId: 'm', period, startMinute, endMinute, row, col });

  const event = (period: number, minutes: number, seconds = 0, zone: { row: number; col: number } | null = { row: 2, col: 4 }) =>
    ({ period, matchTime: minutes * 60 + seconds, zone });

  describe('con zona', () => {
    it('devuelve el tramo que contiene el minuto cuando coincide con la zona', () => {
      const tramo = segment('a', 1, 10, 25);

      const link = resolveEventZoneLink(event(1, 12), [segment('x', 1, 0, 10, 1, 1), tramo]);

      expect(link?.segment).toBe(tramo);
      expect(link?.gap).toBeNull();
      expect(link?.minute).toBe(12);
      expect(link?.isAddedTime).toBeFalse();
    });

    it('el inicio es inclusivo y el fin exclusivo: el minuto 25 es del tramo que empieza en 25', () => {
      const primero = segment('a', 1, 10, 25, 2, 4);
      const segundo = segment('b', 1, 25, 40, 2, 4);

      expect(resolveEventZoneLink(event(1, 10), [primero, segundo])?.segment).toBe(primero);
      expect(resolveEventZoneLink(event(1, 24, 59), [primero, segundo])?.segment).toBe(primero);
      expect(resolveEventZoneLink(event(1, 25), [primero, segundo])?.segment).toBe(segundo);
    });

    it('en el 2T usa minutos acumulados (40–80)', () => {
      const tramo = segment('a', 2, 50, 60);

      expect(resolveEventZoneLink(event(2, 55), [tramo])?.segment).toBe(tramo);
      expect(resolveEventZoneLink(event(2, 55), [tramo])?.minute).toBe(55);
    });

    it('no mezcla tiempos: un tramo del 2T no explica un evento del 1T', () => {
      const link = resolveEventZoneLink(event(1, 55), [segment('a', 2, 50, 60)]);

      expect(link?.segment).toBeNull();
    });

    it('si el tramo no coincide con la zona del evento, devuelve solo el minuto (se muestra solo la zona)', () => {
      const link = resolveEventZoneLink(event(1, 12, 0, { row: 3, col: 6 }), [segment('a', 1, 10, 25, 2, 4)]);

      expect(link?.segment).toBeNull();
      expect(link?.gap).toBeNull();
      expect(link?.minute).toBe(12);
    });

    it('con zona pero sin ningún tramo en ese minuto, tampoco ofrece hueco', () => {
      const link = resolveEventZoneLink(event(1, 12), []);

      expect(link?.segment).toBeNull();
      expect(link?.gap).toBeNull();
    });
  });

  describe('tiempo añadido', () => {
    it('después del 40′ del 1T cuenta en el tramo que termina en 40′', () => {
      const ultimo = segment('a', 1, 30, 40);

      const link = resolveEventZoneLink(event(1, 41, 30), [ultimo]);

      expect(link?.segment).toBe(ultimo);
      expect(link?.minute).toBe(39);
      expect(link?.isAddedTime).toBeTrue();
    });

    it('después del 80′ del 2T cuenta en el tramo que termina en 80′', () => {
      const ultimo = segment('a', 2, 70, 80);

      const link = resolveEventZoneLink(event(2, 83), [ultimo]);

      expect(link?.segment).toBe(ultimo);
      expect(link?.minute).toBe(79);
      expect(link?.isAddedTime).toBeTrue();
    });

    it('el segundo exacto 40:00 ya es tiempo añadido; 39:59 no', () => {
      expect(resolveEventZoneLink(event(1, 39, 59), [])?.isAddedTime).toBeFalse();
      expect(resolveEventZoneLink(event(1, 40, 0), [])?.isAddedTime).toBeTrue();
    });

    it('sin zona, el hueco del tiempo añadido es el último del tiempo', () => {
      const link = resolveEventZoneLink(event(1, 42, 0, null), [segment('a', 1, 0, 30)]);

      expect(link?.gap).toEqual({ period: 1, start: 30, end: 40 });
      expect(link?.isAddedTime).toBeTrue();
    });
  });

  describe('sin zona', () => {
    it('devuelve el hueco que contiene el minuto', () => {
      const link = resolveEventZoneLink(event(1, 12, 0, null), [segment('a', 1, 0, 10), segment('b', 1, 20, 40)]);

      expect(link?.segment).toBeNull();
      expect(link?.gap).toEqual({ period: 1, start: 10, end: 20 });
    });

    it('sin ningún tramo el hueco es todo el tiempo', () => {
      expect(resolveEventZoneLink(event(2, 55, 0, null), [])?.gap).toEqual({ period: 2, start: 40, end: 80 });
    });

    it('sin zona pero dentro de un tramo (datos desfasados) no ofrece hueco ni tramo', () => {
      const link = resolveEventZoneLink(event(1, 12, 0, null), [segment('a', 1, 10, 25)]);

      expect(link?.segment).toBeNull();
      expect(link?.gap).toBeNull();
    });
  });

  describe('evento sin tiempo válido', () => {
    it('devuelve null si el período no es 1 ni 2', () => {
      expect(resolveEventZoneLink(event(0, 12), [])).toBeNull();
      expect(resolveEventZoneLink(event(3, 12), [])).toBeNull();
    });

    it('devuelve null si el minuto de juego no es un número válido', () => {
      expect(resolveEventZoneLink({ period: 1, matchTime: NaN, zone: null }, [])).toBeNull();
      expect(resolveEventZoneLink({ period: 1, matchTime: -5, zone: null }, [])).toBeNull();
    });
  });
});
