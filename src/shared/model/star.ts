import { array, infer as Infer } from 'zod';
import { EntityTypes, type EntityId, entityLocatorSchema } from './entity';

export const starsDTOSchema = array(entityLocatorSchema);

export type StarsDTO = Infer<typeof starsDTOSchema>;

export interface StarRecord {
  entityId: EntityId;
  entityType: EntityTypes;
  id: EntityId;
  title?: string;
}

export interface Starable {
  isStar: boolean;
}
