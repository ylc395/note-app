import type { InjectionToken } from 'tsyringe';

import type { EntityTypes } from 'interface/entity';
import type { TaskResult } from 'model/task';

import type { RemoteCallable, RemoteId } from './remoteApi';

export const REMOTE_ID: RemoteId<MainApp> = 'MainApp';

export enum Statuses {
  NotReady,
  Online,
  ConnectionFailure,
  EmptyToken,
  InvalidToken,
}

export interface Payload extends TaskResult {
  sourceUrl: string;
  parentId: string | null;
}

export interface MainApp extends RemoteCallable {
  setToken: (token: string) => Promise<void>;
  // getTree: <T extends Tree>(type: EntityTypes, id?: EntityId | null) => Promise<T>;
  save: (saveAs: EntityTypes, payload: Payload) => Promise<void>;
  getStatus: () => Promise<Statuses>;
}

export const token: InjectionToken<MainApp> = Symbol();
