import type { Query } from 'mobx-tanstack-query';
import type { EntityId, EntityPath, EntityTypes, Icon } from '#domain/shared/model/entity';

export interface EntitySource<T> {
  readonly id: EntityId;
  readonly type: EntityTypes;
  readonly value: Query<T>;
  readonly path: Query<EntityPath>;
  readonly title: string;
  readonly icon: Icon | null;
  readonly blob?: Query<ArrayBuffer>;
}
