import { ref, reactive, computed, shallowRef } from '@vue/reactivity';
import pick from 'lodash/pick';
import pull from 'lodash/pull';
import { container } from 'tsyringe';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { TagDTO, TagVO, TagQuery, TagTypes } from 'interface/Tag';
import TagForm, { TagFormModel } from './form/TagForm';

interface TagTreeNode {
  id: TagVO['id'];
  name: TagVO['name'];
  children?: TagTreeNode[];
  parentId?: TagVO['id'];
}

export default class TagTree {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly roots = ref<TagTreeNode[]>([]);
  #nodesMap: Record<TagTreeNode['id'], TagTreeNode> = {};
  readonly #tagType: TagTypes;
  readonly editingTag = shallowRef<TagForm>();

  readonly selectedTagId = ref<TagTreeNode['id']>();

  readonly selectedTag = computed<TagTreeNode | undefined>(() => {
    if (this.selectedTagId.value) {
      return this.#nodesMap[this.selectedTagId.value];
    }
  });

  constructor(tagType: TagTypes) {
    this.#tagType = tagType;
  }

  load = async () => {
    this.#nodesMap = {};
    const { body: tags } = await this.#remote.get<TagQuery, Required<TagVO>[]>('/tags', { type: this.#tagType });
    this.roots.value = this.#build(tags);
  };

  #build(allTags: Required<TagVO>[]) {
    for (const { id, name, parentId } of allTags) {
      this.#nodesMap[id] = reactive({ id, name, parentId });
    }

    const rootIds: TagTreeNode['id'][] = [];

    for (const { parentId, id } of allTags) {
      const parentNode = this.#nodesMap[parentId];

      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        parentNode.children.push(this.#nodesMap[id]!);
      } else {
        rootIds.push(id);
      }
    }

    const roots = Object.values(pick(this.#nodesMap, rootIds));
    roots.unshift({
      id: 0,
      name: '无标签',
    });

    return roots;
  }

  startCreatingTag = async () => {
    if (this.editingTag.value) {
      throw new Error('tag form existed!');
    }

    const tag = new TagForm();
    tag.handleSubmit(this.#createTag);

    this.editingTag.value = tag;
  };

  readonly #createTag = async (newTag: TagFormModel) => {
    const {
      body: { id, name, parentId },
    } = await this.#remote.post<TagDTO, Required<TagVO>>('/tags', {
      ...newTag,
      ...(this.selectedTagId.value ? { parentId: this.selectedTagId.value } : null),
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

    this.editingTag.value = undefined;
  };

  stopCreatingTag = () => {
    if (!this.editingTag.value) {
      throw new Error('no editing tag');
    }

    this.editingTag.value.destroy();
    this.editingTag.value = undefined;
  };

  selectTag = async (id: TagTreeNode['id'] | undefined) => {
    this.selectedTagId.value = id;
  };

  deleteTag = (id: number, children: boolean) => {
    const target = this.#nodesMap[id];

    if (!target || typeof target.parentId === 'undefined') {
      throw new Error('invalid tag id');
    }

    const parent = this.#nodesMap[target.parentId];

    pull(parent?.children || this.roots.value, target);

    if (!target.children) {
      return;
    }

    for (const child of target.children) {
      if (children) {
        delete this.#nodesMap[child.id];
      } else {
        (parent?.children || this.roots.value).push(child);
        if (parent?.id) {
          child.parentId = parent.id;
        } else {
          delete child.parentId;
        }
      }
    }
  };
}
