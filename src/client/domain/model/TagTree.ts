import { ref, reactive, computed, shallowRef } from '@vue/reactivity';
import pick from 'lodash/pick';
import pull from 'lodash/pull';
import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { TagDTO, TagVO, TagQuery, TagTypes } from 'interface/Tag';
import TagForm, { TagFormModel } from './form/TagForm';

interface TagTreeNode {
  id: TagVO['id'];
  name: TagVO['name'];
  children?: TagTreeNode[];
  parentId?: TagVO['id'];
}

export enum Events {
  Deleted = 'tag:deleted',
}

export default class TagTree extends EventEmitter<Events> {
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
    super();
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

    this.selectedTagId.value = id;
    this.stopCreatingTag();
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

  deleteTag = async (id: number, cascade: boolean) => {
    await this.#remote.delete<void, void, { cascade: boolean }>(`/tags/${id}`, undefined, { cascade });
    const target = this.#nodesMap[id];

    if (!target) {
      throw new Error('invalid tag id');
    }

    delete this.#nodesMap[id];

    const parent = target.parentId ? this.#nodesMap[target.parentId] : undefined;
    let isRoot = false;

    if (parent) {
      if (!parent.children) throw new Error('no children');
      pull(parent.children, target);

      if (parent.children.length === 0) {
        delete parent.children;
      }
    } else {
      pull(this.roots.value, target);
      isRoot = true;
    }

    if (cascade) {
      const deletedIds: TagVO['id'][] = [];
      const traverse = (node: TagTreeNode) => {
        deletedIds.push(node.id);

        if (!node.children) {
          return;
        }

        for (const child of node.children) {
          traverse(child);
        }
      };

      traverse(target);

      for (const deletedId of deletedIds) {
        delete this.#nodesMap[deletedId];
      }

      this.emit(Events.Deleted, deletedIds);
      return;
    }

    for (const child of target.children || []) {
      if (isRoot) {
        this.roots.value.push(child);
        delete child.parentId;
      } else {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        parent!.children!.push(child);
        child.parentId = parent!.id;
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      }
    }

    this.emit(Events.Deleted, [target.id]);
  };
}
