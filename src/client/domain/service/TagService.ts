import { singleton, container } from 'tsyringe';
import { toRaw } from '@vue/reactivity';

import { TagTypes, type TagQuery, type TagVO, type TagDTO } from 'interface/Tag';
import TagTree from 'model/TagTree';
import { type Remote, token as remoteToken } from 'infra/Remote';

@singleton()
export default class TagService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly materialTagTree = new TagTree();
  constructor() {
    this.#init();
  }

  #init = async () => {
    const { body: tags } = await this.#remote.get<TagQuery, TagVO[]>('/tags', { type: TagTypes.Material });
    this.materialTagTree.init(tags);
  };

  createTag = async (newTag: TagDTO) => {
    const { body: createdTag } = await this.#remote.post<TagDTO, TagVO>('/tags', toRaw(newTag));
    this.materialTagTree.addNode(createdTag);
  };
}
