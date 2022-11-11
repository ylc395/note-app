import { observable, makeObservable, computed, action } from 'mobx';
import pick from 'lodash/pick';
import pull from 'lodash/pull';
import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { TagDTO, TagVO, TagQuery } from 'interface/Tag';
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
  constructor() {
    super();
    makeObservable(this);
  }
  readonly #remote: Remote = container.resolve(remoteToken);
  @observable roots: TagTreeNode[] = [];
  #nodesMap: Record<TagTreeNode['id'], TagTreeNode> = {};
  @observable.ref editingTag?: TagForm;
  @observable selectedTagId?: TagTreeNode['id'];

  @computed selectedTag(): TagTreeNode | undefined {
    if (this.selectedTagId) {
      return this.#nodesMap[this.selectedTagId];
    }
  }

  @action.bound
  async load() {
    this.#nodesMap = {};
    const { body: tags } = await this.#remote.get<TagQuery, Required<TagVO>[]>('/tags');
    this.roots = this.build(tags);
  }

  @action.bound
  private build(allTags: Required<TagVO>[]) {
    for (const { id, name, parentId } of allTags) {
      this.#nodesMap[id] = observable({ id, name, parentId });
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

  @action.bound
  async startCreatingTag() {
    if (this.editingTag) {
      throw new Error('tag form existed!');
    }

    const tag = new TagForm();

    tag.handleSubmit(this.createTag);
    this.editingTag = tag;
  }

  @action.bound
  private async createTag(newTag: TagFormModel) {
    const {
      body: { id, name, parentId },
    } = await this.#remote.post<TagDTO, Required<TagVO>>('/tags', {
      ...newTag,
      ...(this.selectedTagId ? { parentId: this.selectedTagId } : null),
    });

    const tagNode = { id, name };

    this.#nodesMap[id] = tagNode;

    const parentNode = this.#nodesMap[parentId];
    if (parentNode) {
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(tagNode);
    } else {
      this.roots.push(tagNode);
    }

    this.selectedTagId = id;
    this.stopCreatingTag();
  }

  @action.bound
  private async stopCreatingTag() {
    if (!this.editingTag) {
      throw new Error('no editing tag');
    }

    this.editingTag.destroy();
    this.editingTag = undefined;
  }

  @action.bound
  selectTag(id: TagTreeNode['id'] | undefined) {
    this.selectedTagId = id;
  }

  @action.bound
  async deleteTag(id: number, cascade: boolean) {
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
      pull(this.roots, target);
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
        this.roots.push(child);
        delete child.parentId;
      } else {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        parent!.children!.push(child);
        child.parentId = parent!.id;
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
      }
    }

    this.emit(Events.Deleted, [target.id]);
  }
}
