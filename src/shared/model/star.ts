import type { infer as Infer } from 'zod';
import { type EntityId, type EntityRecord, entitiesLocatorSchema } from './entity';

export const starsDTOSchema = entitiesLocatorSchema;

export type StarsDTO = Infer<typeof starsDTOSchema>;

export interface StarRecord extends EntityRecord {
  id: EntityId;
  title?: string;
}

export interface Starable {
  isStar: boolean;
}
