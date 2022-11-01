import { ref, reactive, toRaw, computed } from '@vue/reactivity';
import pick from 'lodash/pick';
import { container } from 'tsyringe';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { TagDTO, TagVO, TagQuery, TagTypes } from 'interface/Tag';

interface TagTreeNode {
  id: TagVO['id'];
  name: TagVO['name'];
  children: TagTreeNode[];
}

export type EditingTag = Pick<TagDTO, 'name'>;

export default class TagTree {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly roots = ref<TagTreeNode[]>([]);
  #nodesMap: Record<TagTreeNode['id'], TagTreeNode> = {};
  readonly #tagType: TagTypes;

  readonly #selectedTagId = ref<TagTreeNode['id']>(0);

  readonly selectedTag = computed<TagTreeNode | undefined>(() => this.#nodesMap[this.#selectedTagId.value]);

  constructor(tagType: TagTypes) {
    this.#tagType = tagType;
    this.#init();
  }

  async #init() {
    this.#nodesMap = {};
    const { body: tags } = await this.#remote.get<TagQuery, TagVO[]>('/tags', { type: this.#tagType });
    this.roots.value = this.#build(tags);
  }

  #build(allTags: TagVO[]) {
    for (const { id, name } of allTags) {
      this.#nodesMap[id] = reactive({ id, name, children: [] });
    }

    const rootIds: TagTreeNode['id'][] = [];

    for (const { parentId, id } of allTags) {
      if (this.#nodesMap[parentId]) {
        const node = this.#nodesMap[parentId];
        node.children.push(this.#nodesMap[id]);
      } else {
        rootIds.push(id);
      }
    }

    return Object.values(pick(this.#nodesMap, rootIds));
  }

  createTag = async (newTag: EditingTag) => {
    const {
      body: { id, name, parentId, error },
    } = await this.#remote.post<TagDTO, TagVO>('/tags', {
      ...toRaw(newTag),
      parentId: this.#selectedTagId.value,
      type: this.#tagType,
    });

    if (error) {
      throw new Error(error);
    }

    const tagNode = reactive({ id, name, children: [] });

    this.#nodesMap[id] = tagNode;

    if (this.#nodesMap[parentId]) {
      this.#nodesMap[parentId].children.push(tagNode);
    } else {
      this.roots.value.push(tagNode);
    }
  };

  selectTag = async (id: TagTreeNode['id']) => {
    this.#selectedTagId.value = id;
  };
}
