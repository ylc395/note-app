import { array, infer as Infer } from 'zod';
import { type EntityId, type EntityRecord, entityLocatorSchema } from './entity';

export const starsDTOSchema = array(entityLocatorSchema);

export type StarsDTO = Infer<typeof starsDTOSchema>;

export interface StarRecord extends EntityRecord {
  id: EntityId;
  title?: string;
}

export interface Starable {
  isStar: boolean;
}
