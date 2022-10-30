import { ref, reactive, toRaw } from '@vue/reactivity';
import pick from 'lodash/pick';
import { container } from 'tsyringe';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { TagDTO, TagVO } from 'interface/Tag';

interface TagTreeNode {
  id: TagVO['id'];
  name: TagVO['name'];
  children: TagTreeNode[];
}

export default class TagTree {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly roots = ref<TagTreeNode[]>([]);
  #nodesMap: Record<TagTreeNode['id'], TagTreeNode> = {};

  readonly selectedNodeId = ref<TagTreeNode['id']>(0);

  init(allTags: TagVO[]) {
    this.#nodesMap = {};
    this.roots.value = this.#build(allTags);
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

  createTag = async (newTag: TagDTO) => {
    const {
      body: { id, name, parentId },
    } = await this.#remote.post<TagDTO, TagVO>('/tags', toRaw(newTag));
    const tagNode = reactive({ id, name, children: [] });

    this.#nodesMap[id] = tagNode;

    if (this.#nodesMap[parentId]) {
      this.#nodesMap[parentId].children.push(tagNode);
    } else {
      this.roots.value.push(tagNode);
    }
  };

  selectNode = async (id: TagTreeNode['id']) => {
    this.selectedNodeId.value = id;
  };
}
