import { ref, reactive, computed } from '@vue/reactivity';
import pick from 'lodash/pick';
import { container } from 'tsyringe';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { TagDTO, TagVO, TagQuery, TagTypes } from 'interface/Tag';
import type { TagFormModel } from './form/TagForm';

interface TagTreeNode {
  id: TagVO['id'];
  name: TagVO['name'];
  children?: TagTreeNode[];
}

export default class TagTree {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly roots = ref<TagTreeNode[]>([]);
  #nodesMap: Record<TagTreeNode['id'], TagTreeNode> = {};
  readonly #tagType: TagTypes;

  readonly #selectedTagId = ref<TagTreeNode['id']>();

  readonly selectedTag = computed<TagTreeNode | undefined>(() => {
    if (this.#selectedTagId.value) {
      return this.#nodesMap[this.#selectedTagId.value];
    }
  });

  constructor(tagType: TagTypes) {
    this.#tagType = tagType;
    this.#init();
  }

  async #init() {
    this.#nodesMap = {};
    const { body: tags } = await this.#remote.get<TagQuery, TagVO[]>('/tags', { type: this.#tagType });
    this.roots.value = this.#build(tags);
    this.#appendNoTagNode();
  }

  #build(allTags: TagVO[]) {
    for (const { id, name } of allTags) {
      this.#nodesMap[id] = reactive({ id, name });
    }

    const rootIds: TagTreeNode['id'][] = [];

    for (const { parentId, id } of allTags) {
      if (this.#nodesMap[parentId]) {
        const node = this.#nodesMap[parentId];

        if (!node.children) {
          node.children = [];
        }
        node.children.push(this.#nodesMap[id]);
      } else {
        rootIds.push(id);
      }
    }

    return Object.values(pick(this.#nodesMap, rootIds));
  }

  #appendNoTagNode() {
    const noTagNode: TagTreeNode = {
      id: 0,
      name: '无标签',
    };
    this.roots.value.unshift(noTagNode);
  }

  createTag = async (newTag: TagFormModel) => {
    const {
      body: { id, name, parentId },
    } = await this.#remote.post<TagDTO, TagVO>('/tags', {
      ...newTag,
      parentId: this.#selectedTagId.value,
      type: this.#tagType,
    });

    const tagNode = reactive({ id, name });

    this.#nodesMap[id] = tagNode;

    const parentNode = this.#nodesMap[parentId];
    if (parentNode) {
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(tagNode);
    } else {
      this.roots.value.push(tagNode);
    }
  };

  selectTag = async (id: TagTreeNode['id'] | undefined) => {
    this.#selectedTagId.value = id;
  };
}
