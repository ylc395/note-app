import type { Query } from 'mobx-tanstack-query';
import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
import type { EntityId, EntityPath, EntityTypes, Icon } from '#domain/shared/model/entity';
import type { ExternalReference, LinkVO } from '#domain/shared/model/content';

// 一种针对任意类型实体的抽象，便于其他地方能够以同样的方式读取任意类型的实体
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class Entity<T = any> {
  constructor(options: { abortSignal: AbortSignal; options?: () => { enabled: boolean } }) {
    this.links = createQuery(() => this.remote.content.queryLinksOf.query(this.id), {
      abortSignal: options.abortSignal,
      options: () => ({
        ...options.options,
        queryKey: ['links', this.id],
      }),
      select: (data) =>
        Object.groupBy(data, (link) => {
          if ('url' in link) {
            return 'external';
          }

          if (link.sourceEntity.id === link.targetEntity.id) {
            return 'self';
          }

          if (link.sourceEntity.id === this.id) {
            return 'start';
          }

          return 'end';
        }) as {
          external: ExternalReference[];
          self: LinkVO[];
          start: LinkVO[];
          end: LinkVO[];
        },
    });
  }
  protected readonly remote = container.resolve(rpcToken);
  abstract readonly id: EntityId;
  abstract readonly type: EntityTypes;
  abstract readonly value: Query<T>;
  abstract readonly path: Query<EntityPath>;
  abstract readonly title: string;
  abstract readonly icon: Icon | null;
  abstract readonly blob?: Query<ArrayBuffer>;
  public readonly links;
  abstract readonly mimeType: string | null;
}
