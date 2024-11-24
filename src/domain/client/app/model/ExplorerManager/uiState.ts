import { literal, object, union, type infer as ZodInfer } from 'zod';

import UIState from '../abstract/UIState';
import { EntityTypes } from '#domain/shared/model/entity';

const schema = object({
  type: union([literal(EntityTypes.Note), literal(EntityTypes.Memo), literal(EntityTypes.Material)]),
});

export type ExplorerTypes = ZodInfer<typeof schema>['type'];

export function create() {
  return new UIState('explorer-manager', schema);
}
