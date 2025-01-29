import { createQuery } from 'mobx-tanstack-query/preset';
import { computed } from 'mobx';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { EntityTypes } from '#domain/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
// import { keyBy } from 'lodash-es';

export default class TopicList {
  constructor(entityType?: EntityTypes) {
    this.topicQuery = createQuery(() => this.remote.content.queryTopics.query({ type: entityType }), {
      queryKey: ['topics', entityType],
    });
  }

  private readonly remote = container.resolve(rpcToken);

  public readonly topicQuery;

  public destroy() {
    this.topicQuery.destroy();
  }

  // this is an flatten tree
  @computed
  public get tree() {
    if (!this.topicQuery.result.data) {
      return null;
    }

    // const topics = keyBy(this.topicQuery.result.data, ({ name }) => name);
    // const names = Object.keys(topics).sort((t1, t2) => {
    //   if (t1.startsWith(t2)) return 1;
    //   if (t2.startsWith(t1)) return -1;
    //   return 0;
    // });

    // return names.map(name => {
    //   cons
    // })

    return this.topicQuery.result.data;
  }
}
