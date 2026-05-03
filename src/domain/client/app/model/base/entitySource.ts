import type { Query } from 'mobx-tanstack-query';
import type { EntityId, EntityPath, EntityTypes, Icon } from '#domain/shared/model/entity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EntitySource<T = any> {
  readonly id: EntityId;
  readonly type: EntityTypes;
  readonly value: Query<T>;
  readonly path: Query<EntityPath>;
  readonly title: string;
  readonly icon: Icon | null;
  readonly blob?: Query<ArrayBuffer>;
  readonly mimeType: string | null;
}
