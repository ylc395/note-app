import type { InjectionToken } from 'tsyringe';

import type { EntityParentId } from 'model/entity';
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
  parentId: EntityParentId;
}

export interface MainApp extends RemoteCallable {
  setToken: (token: string) => Promise<void>;
  getStatus: () => Promise<Statuses>;
  fetch<T, K = void>(method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, body?: K): Promise<T | null>;
}

export const token: InjectionToken<MainApp> = Symbol();
