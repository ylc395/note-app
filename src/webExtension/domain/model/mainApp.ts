import type { EntityParentId } from 'model/entity';
import type { TaskResult } from './task';

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
