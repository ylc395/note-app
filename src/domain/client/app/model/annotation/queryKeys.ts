import type { EntityId } from '#domain/shared/model/entity';

export const getAnnotationListQueryKey = (targetId: EntityId) => {
  return ['annotations', { targetId }];
};
