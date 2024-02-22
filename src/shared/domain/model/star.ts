import { object, string, type infer as Infer } from 'zod';
import type { EntityId, EntityLocator } from './entity.js';

export const starDTOSchema = object({
  entityId: string(),
});

export type StarDTO = Infer<typeof starDTOSchema>;

export interface StarVO extends EntityLocator {
  title: string;
  mainEntityId?: EntityId;
  icon: string | null;
}
