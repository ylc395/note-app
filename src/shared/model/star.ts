import type { infer as Infer } from 'zod';
import { type EntityId, type EntityLocator, entityLocatorSchema } from './entity';

export const starsDTOSchema = entityLocatorSchema.array();

export type StarsDTO = Infer<typeof starsDTOSchema>;

export interface StarRecord extends Omit<EntityLocator, 'mimeType'> {
  id: EntityId;
  title?: string;
}

export interface Starable {
  isStar: boolean;
}
