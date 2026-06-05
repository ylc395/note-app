import type { Query } from 'mobx-tanstack-query';
import { createQuery } from 'mobx-tanstack-query/preset';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
import type { EntityId, EntityPath, EntityTypes, Icon } from '#domain/shared/model/entity';
import type { ExternalReference, LinkVO } from '#domain/shared/model/content';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default abstract class EntitySource<T = any> {
  constructor(options: { abortSignal: AbortSignal; options?: () => { enabled: boolean } }) {
    this.links = createQuery(() => this.remote.content.queryLinksOf.query(this.id), {
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
