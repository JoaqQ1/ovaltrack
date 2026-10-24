import { TestBed } from '@angular/core/testing';
import { LocalDatabaseService } from './local-database.service';
import { buildBackendEventResponse, buildLocalEvent, clearLocalDatabases } from '../../../testing/offline-test-helpers';

describe('LocalDatabaseService (eventos)', () => {
  let cache: LocalDatabaseService;

  beforeEach(async () => {
    cache = TestBed.inject(LocalDatabaseService);
    await clearLocalDatabases();
  });

  describe('markEventSynchronized', () => {
    it('marca como sincronizado un evento que no cambió durante la petición', async () => {
      const event = buildLocalEvent();
      await cache.saveEvent(event);

      await cache.markEventSynchronized(event, buildBackendEventResponse(event));

      expect(await cache.getPendingEvents('match-1')).toEqual([]);
      const [stored] = await cache.getEventsByMatch('match-1');
      expect(stored.backendEventId).toBe('backend-event-1');
    });

    it('no resucita un evento borrado mientras su creación estaba en vuelo', async () => {
      const sentEvent = buildLocalEvent();
      await cache.saveEvent(sentEvent);
      await cache.deleteEvent(sentEvent);

      await cache.markEventSynchronized(sentEvent, buildBackendEventResponse(sentEvent));

      expect(await cache.getEventsByMatch('match-1')).toEqual([]);
      const [pendingDeletion] = await cache.getPendingEvents('match-1');
      expect(pendingDeletion).toEqual(jasmine.objectContaining({
        id: 'event-1',
        active: false,
        backendEventId: 'backend-event-1',
        synchronizedAt: null,
      }));
    });

    it('no recrea un evento eliminado localmente', async () => {
      const sentEvent = buildLocalEvent();

      const result = await cache.markEventSynchronized(sentEvent, buildBackendEventResponse(sentEvent));

      expect(result).toBeUndefined();
      expect(await cache.getStatusData('match-1')).toEqual(jasmine.objectContaining({ events: [] }));
    });
  });

  describe('mergeRemoteEvents', () => {
    it('conserva un borrado local pendiente aunque aún no tenga id del backend', async () => {
      const localEvent = buildLocalEvent();
      await cache.saveEvent(localEvent);
      await cache.deleteEvent(localEvent);

      const visible = await cache.mergeRemoteEvents('match-1', [buildBackendEventResponse(localEvent)]);

      expect(visible).toEqual([]);
      const [pendingDeletion] = await cache.getPendingEvents('match-1');
      expect(pendingDeletion.backendEventId).toBe('backend-event-1');
    });
  });
});
