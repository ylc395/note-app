import { EntityId } from './entity.js';

export interface Revision {
  id: EntityId;
  entityId: EntityId;
  titleDiff: string | null;
  bodyDiff: string | null;
  previousId: EntityId | null;
  appName: string;
  deviceName: string;
  name: string | null;
  createdAt: number;
  isAuto: boolean;
}

/**
 * @api
 */
export type RevisionPatchDTO = Pick<Revision, 'name'>;

export type RevisionVO = Revision;
