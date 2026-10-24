import { Injectable } from '@angular/core';
import { liveCaptureDatabase, matchDatabase } from '../local-databases';
import { LiveCaptureEventType, LiveCapturePersistedState, LiveCaptureQuery } from '../../match/types/live-capture.types';
import { BackendEventResponse, LocalMatchEvent } from '../../match/types/event.types';
import { Match, PendingMatchMutation } from '../../match/types/match.types';
import { Division } from '../../division/types/division.types';
import { AvailablePlayer, SavedRoster } from '../../match/types/roster.types';
import { UserContext } from '../../auth/types/auth.types';

@Injectable({ providedIn: 'root' })
export class LocalDatabaseService {

  saveUserContext(context: UserContext): Promise<void> {
    return matchDatabase.userContexts.put({
      ...context,
      cachedAt: Date.now(),
    }).then(() => undefined);
  }

  getUserContext(userId: string): Promise<UserContext | undefined> {
    return matchDatabase.userContexts.get(userId);
  }

  clearUserContext(userId: string): Promise<void> {
    return matchDatabase.userContexts.delete(userId).then(() => undefined);
  }

  getMatches(): Promise<Match[]> {
    return matchDatabase.matches.toArray();
  }

  getMatch(matchId: string): Promise<Match | undefined> {
    return matchDatabase.matches.get(matchId);
  }

  saveMatches(matches: Match[]): Promise<void> {
    return matchDatabase.matches.bulkPut(matches).then(() => undefined);
  }

  getMatchesByDivision(divisionId: string): Promise<Match[]> {
    return matchDatabase.matches.where('divisionId').equals(divisionId).toArray();
  }

  saveDivisions(divisions: Division[]): Promise<void> {
    return matchDatabase.divisions.bulkPut(divisions).then(() => undefined);
  }

  getDivisionsByClub(clubId: string): Promise<Division[]> {
    return matchDatabase.divisions.where('clubId').equals(clubId).toArray();
  }

  saveRoster(matchId: string, roster: SavedRoster): Promise<void> {
    return matchDatabase.rosters.put({
      matchId,
      startingPlayers: roster.startingPlayers,
      substitutePlayers: roster.substitutePlayers,
    }).then(() => undefined);
  }

  getRoster(matchId: string): Promise<SavedRoster | undefined> {
    return matchDatabase.rosters.get(matchId);
  }
  
  savePersonsByDivisionId(players: (AvailablePlayer & { divisionId?: string })[]): Promise<void> {
    return matchDatabase.divisionPlayers.bulkPut(players as any).then(() => undefined)
  }

  getPersonsByDivisionId(divisionId: string): Promise<AvailablePlayer[]> {
    return matchDatabase.divisionPlayers.where('divisionId').equals(divisionId).toArray();
  }

  savePendingMatchMutation(mutation: PendingMatchMutation): Promise<void> {
    return matchDatabase.pendingMatchMutations.put(mutation).then(() => undefined);
  }

  getPendingMatchMutations(): Promise<PendingMatchMutation[]> {
    return matchDatabase.pendingMatchMutations.orderBy('createdAt').toArray();
  }

  deletePendingMatchMutation(id: string): Promise<void> {
    return matchDatabase.pendingMatchMutations.delete(id).then(() => undefined);
  }

  /**
   * Cierra una mutación ya confirmada por el servidor: la elimina y guarda el partido
   * devuelto, salvo que durante la petición se haya encolado otra mutación con el mismo id.
   * En ese caso se conservan ambas cosas para que la mutación nueva se envíe en el próximo flush.
   * @returns `true` si la mutación seguía vigente y se cerró.
   */
  completePendingMatchMutation(mutation: PendingMatchMutation, serverMatch: Match): Promise<boolean> {
    return matchDatabase.transaction(
      'rw',
      matchDatabase.pendingMatchMutations,
      matchDatabase.matches,
      async () => {
        if (!await this.isPendingMutationUnchanged(mutation)) {
          return false;
        }
        await matchDatabase.pendingMatchMutations.delete(mutation.id);
        await matchDatabase.matches.put(serverMatch);
        return true;
      },
    );
  }

  /** Descarta una mutación rechazada, salvo que haya sido reemplazada por otra más nueva. */
  discardPendingMatchMutation(mutation: PendingMatchMutation): Promise<boolean> {
    return matchDatabase.transaction('rw', matchDatabase.pendingMatchMutations, async () => {
      if (!await this.isPendingMutationUnchanged(mutation)) {
        return false;
      }
      await matchDatabase.pendingMatchMutations.delete(mutation.id);
      return true;
    });
  }

  private async isPendingMutationUnchanged(mutation: PendingMatchMutation): Promise<boolean> {
    const current = await matchDatabase.pendingMatchMutations.get(mutation.id);
    return current !== undefined
      && current.createdAt === mutation.createdAt
      && current.action === mutation.action;
  }

  getEventTypes(): Promise<LiveCaptureEventType[]> {
    return liveCaptureDatabase.eventTypes.toArray();
  }

  saveEventTypes(eventTypes: LiveCaptureEventType[]): Promise<void> {
    return liveCaptureDatabase.eventTypes.bulkPut(eventTypes).then(() => undefined);
  }

  getBootstrapData(query: LiveCaptureQuery): Promise<{
    persistedState: LiveCapturePersistedState | undefined;
    eventTypes: LiveCaptureEventType[];
    events: LocalMatchEvent[];
  }> {
    return Promise.all([
      liveCaptureDatabase.states.get(query.matchId),
      this.getEventTypes(),
      liveCaptureDatabase.events.where('matchId').equals(query.matchId).filter(event => event.active).sortBy('localSequence'),
    ]).then(([persistedState, eventTypes, events]) => ({ persistedState, eventTypes, events }));
  }

  saveState(state: LiveCapturePersistedState): Promise<void> {
    return liveCaptureDatabase.states.put(state).then(() => undefined);
  }

  saveEvent(event: LocalMatchEvent): Promise<LocalMatchEvent> {
    return liveCaptureDatabase.events.put(event).then(() => event);
  }

  /**
   * Aplica la confirmación del servidor sobre la versión actual del evento, no sobre la copia
   * que se envió. Si se borró localmente mientras la petición estaba en vuelo, se guarda el id
   * del backend pero el evento sigue pendiente para que el borrado también se sincronice.
   * @returns el evento actualizado, o `undefined` si ya no existe localmente.
   */
  markEventSynchronized(sentEvent: LocalMatchEvent, response: BackendEventResponse): Promise<LocalMatchEvent | undefined> {
    return liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      const currentEvent = await liveCaptureDatabase.events.get(sentEvent.id);
      if (!currentEvent) {
        return undefined;
      }

      const changedWhileInFlight = currentEvent.active !== sentEvent.active;
      const synchronizedEvent: LocalMatchEvent = {
        ...currentEvent,
        backendEventId: response.id,
        synchronizedAt: changedWhileInFlight ? null : response.synchronizedAt,
        syncAttempts: 0,
        syncFailedAt: null,
        syncErrorMessage: null,
      };
      await liveCaptureDatabase.events.put(synchronizedEvent);
      return synchronizedEvent;
    });
  }

  /**
   * Marca un evento como rechazado por el servidor para que deje de bloquear la cola.
   * Se ignora si el evento cambió mientras la petición estaba en vuelo: el rechazo era de otra versión.
   * @returns `true` si el evento quedó marcado como fallido.
   */
  markEventSyncFailed(sentEvent: LocalMatchEvent, errorMessage: string): Promise<boolean> {
    return liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      const currentEvent = await liveCaptureDatabase.events.get(sentEvent.id);
      if (!currentEvent || currentEvent.active !== sentEvent.active) {
        return false;
      }

      await liveCaptureDatabase.events.put({
        ...currentEvent,
        syncAttempts: (currentEvent.syncAttempts ?? 0) + 1,
        syncFailedAt: new Date().toISOString(),
        syncErrorMessage: errorMessage,
      });
      return true;
    });
  }

  /** Cuenta un intento fallido por un error transitorio; el evento sigue pendiente. */
  recordEventSyncAttempt(eventId: string): Promise<void> {
    return liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      const currentEvent = await liveCaptureDatabase.events.get(eventId);
      if (currentEvent) {
        await liveCaptureDatabase.events.put({
          ...currentEvent,
          syncAttempts: (currentEvent.syncAttempts ?? 0) + 1,
        });
      }
    });
  }

  async mergeRemoteEvents(matchId: string, remoteEvents: BackendEventResponse[]): Promise<LocalMatchEvent[]> {
    await liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      const localEvents = await liveCaptureDatabase.events.where('matchId').equals(matchId).toArray();
      const byLocalId = new Map(localEvents.map(event => [event.id, event]));
      const byBackendId = new Map(
        localEvents
          .filter(event => event.backendEventId)
          .map(event => [event.backendEventId!, event]),
      );
      const byClientId = new Map(
        localEvents
          .filter(event => event.clientEventId)
          .map(event => [event.clientEventId!, event]),
      );
      let nextSequence = localEvents.reduce(
        (highest, event) => Math.max(highest, event.localSequence),
        0,
      );

      for (const remoteEvent of remoteEvents) {
        const localEvent = byBackendId.get(remoteEvent.id)
          ?? (remoteEvent.clientEventId ? byLocalId.get(remoteEvent.clientEventId) : undefined)
          ?? (remoteEvent.clientEventId ? byClientId.get(remoteEvent.clientEventId) : undefined);

        const hasPendingLocalDeletion = localEvent && !localEvent.active && localEvent.synchronizedAt === null;
        if (hasPendingLocalDeletion) {
          if (!localEvent.backendEventId) {
            // Borrado mientras su creación estaba en vuelo: se guarda el id para enviar el DELETE.
            const pendingDeletion: LocalMatchEvent = { ...localEvent, backendEventId: remoteEvent.id };
            await liveCaptureDatabase.events.put(pendingDeletion);
            byBackendId.set(remoteEvent.id, pendingDeletion);
          }
          continue;
        }

        const event: LocalMatchEvent = {
          ...remoteEvent,
          active: remoteEvent.active ?? true,
          id: localEvent?.id ?? remoteEvent.clientEventId ?? remoteEvent.id,
          backendEventId: remoteEvent.id,
          localSequence: localEvent?.localSequence ?? ++nextSequence,
        };

        await liveCaptureDatabase.events.put(event);
        byLocalId.set(event.id, event);
        byBackendId.set(event.backendEventId!, event);
        if (event.clientEventId) {
          byClientId.set(event.clientEventId, event);
        }
      }
    });

    return this.getEventsByMatch(matchId);
  }

  replaceEvents(matchId: string, events: LocalMatchEvent[]): Promise<void> {
    return liveCaptureDatabase.transaction('rw', liveCaptureDatabase.events, async () => {
      await liveCaptureDatabase.events.where('matchId').equals(matchId).delete();
      if (events.length > 0) {
        await liveCaptureDatabase.events.bulkPut(events);
      }
    });
  }

  async deleteEvent(event: LocalMatchEvent): Promise<void> {
    await liveCaptureDatabase.events.update(event.id, {
      active: false,
      synchronizedAt: null,
      syncFailedAt: null,
      syncErrorMessage: null,
    });
  }

  getStatusData(matchId: string): Promise<{
    state: LiveCapturePersistedState | undefined;
    events: LocalMatchEvent[];
  }> {
    return Promise.all([
      liveCaptureDatabase.states.get(matchId),
      liveCaptureDatabase.events.where('matchId').equals(matchId).toArray(),
    ]).then(([state, events]) => ({ state, events }));
  }

  getEventsByMatch(matchId: string): Promise<LocalMatchEvent[]> {
    return liveCaptureDatabase.events
      .where('matchId')
      .equals(matchId)
      .filter(event => event.active === true)
      .sortBy('localSequence');
  }

  getPendingEvents(matchId?: string): Promise<LocalMatchEvent[]> {
    const eventsQuery = matchId
      ? liveCaptureDatabase.events.where('matchId').equals(matchId)
      : liveCaptureDatabase.events.toCollection();

    return eventsQuery.toArray().then(events => events
      .filter(event => event.synchronizedAt === null
        && !event.syncFailedAt
        && (event.active || event.backendEventId != null))
      .sort((first, second) => first.localSequence - second.localSequence));
  }

  deleteMatchData(matchId: string): Promise<void> {
    return liveCaptureDatabase.transaction(
      'rw',
      liveCaptureDatabase.states,
      liveCaptureDatabase.events,
      async () => {
        await liveCaptureDatabase.states.delete(matchId);
        await liveCaptureDatabase.events.where('matchId').equals(matchId).delete();
      },
    );
  }
}