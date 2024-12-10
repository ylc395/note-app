import { literal, object, union, type infer as ZodInfer } from 'zod';
import { EntityTypes } from '#domain/shared/model/entity';

export const schema = object({
  type: union([literal(EntityTypes.Note), literal(EntityTypes.Memo), literal(EntityTypes.Material)]),
});

export type ExplorerTypes = ZodInfer<typeof schema>['type'];
