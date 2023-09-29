import type { infer as Infer } from 'zod';
import { type EntityId, type EntityWithTitle, entityLocatorSchema } from './entity';

export const starsDTOSchema = entityLocatorSchema.array();

export type StarsDTO = Infer<typeof starsDTOSchema>;

export interface StarVO extends EntityWithTitle {
  id: EntityId;
}

export interface Starable {
  isStar: boolean;
}
