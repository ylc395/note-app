import { singleton, container } from 'tsyringe';
import { shallowRef } from '@vue/reactivity';

import type { TagTypes, TagQuery, TagVO } from 'interface/Tag';
import type { TagTree } from 'model/Tag';
import { type Remote, token as remoteToken } from 'infra/Remote';

@singleton()
export default class TagService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly materialTagTree = shallowRef<TagTree>([]);
  async buildTagTree(type: TagTypes) {
    const { body: tags } = await this.#remote.get<TagQuery, TagVO[]>('/tags', { type });

    return;
  }
}
