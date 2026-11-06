import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalDatabaseService } from '../../features/local-database/services/local-database.service';
import { ConnectivityService } from '../services/connectivity.service';
import { SyncManagerService } from '../synchronization/SyncManagerService';
import { LocalSyncStatusSource, resolveSyncStatus } from './sync-status.source';

describe('resolveSyncStatus', () => {
  it('sin red manda sobre todo lo demás', () => {
    expect(resolveSyncStatus({ pendingCount: 3, online: false, retrying: true }))
      .toEqual({ state: 'offline', pendingCount: 3 });
  });

  it('con red y reintento en curso está sincronizando', () => {
    expect(resolveSyncStatus({ pendingCount: 3, online: true, retrying: true }).state).toBe('syncing');
  });

  it('con pendientes está pendiente', () => {
    expect(resolveSyncStatus({ pendingCount: 2, online: true, retrying: false }).state).toBe('pending');
  });

  it('sin pendientes está sincronizado', () => {
    expect(resolveSyncStatus({ pendingCount: 0, online: true, retrying: false }).state).toBe('synced');
  });
});

describe('LocalSyncStatusSource.retry', () => {
  const online = signal(true);
  let syncManager: jasmine.SpyObj<SyncManagerService>;
  let cache: jasmine.SpyObj<LocalDatabaseService>;
  let source: LocalSyncStatusSource;

  beforeEach(() => {
    online.set(true);
    syncManager = jasmine.createSpyObj<SyncManagerService>('SyncManagerService', ['synchronizeAll']);
    cache = jasmine.createSpyObj<LocalDatabaseService>('LocalDatabaseService', ['countPendingChanges']);
    cache.countPendingChanges.and.resolveTo(0);

    TestBed.configureTestingModule({
      providers: [
        LocalSyncStatusSource,
        { provide: SyncManagerService, useValue: syncManager },
        { provide: LocalDatabaseService, useValue: cache },
        { provide: ConnectivityService, useValue: { online } },
      ],
    });
    source = TestBed.inject(LocalSyncStatusSource);
  });

  it('sin red no intenta sincronizar', async () => {
    online.set(false);

    expect(await source.retry()).toBe('offline');
    expect(syncManager.synchronizeAll).not.toHaveBeenCalled();
  });

  it('con red pasa por sincronizando mientras corre la sincronización existente', async () => {
    let stateDuringSync = '';
    syncManager.synchronizeAll.and.callFake(async () => {
      stateDuringSync = source.status().state;
    });

    expect(await source.retry()).toBe('done');
    expect(syncManager.synchronizeAll).toHaveBeenCalledTimes(1);
    expect(stateDuringSync).toBe('syncing');
    expect(source.status().state).not.toBe('syncing');
  });

  it('informa si después de sincronizar siguen quedando cambios', async () => {
    syncManager.synchronizeAll.and.resolveTo();
    cache.countPendingChanges.and.resolveTo(2);

    expect(await source.retry()).toBe('incomplete');
  });

  it('no lanza un segundo reintento mientras hay uno en curso', async () => {
    let finish!: () => void;
    syncManager.synchronizeAll.and.returnValue(new Promise<void>(resolve => (finish = resolve)));

    const first = source.retry();
    expect(await source.retry()).toBe('busy');
    finish();
    await first;

    expect(syncManager.synchronizeAll).toHaveBeenCalledTimes(1);
  });
});
