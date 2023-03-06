import { action, makeObservable, observable, runInAction } from 'mobx';
import pull from 'lodash/pull';
import uniq from 'lodash/uniq';
import { container } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';
import { getEmptyNote, NoteQuery, NoteVO as Note } from 'interface/Note';
import { normalizeTitle } from 'interface/Note';

import type { NoteTreeNode } from './type';

export const VIRTUAL_ROOT_NODE_KEY = 'root';

export enum SortBy {
  Title = 'title',
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export type { NoteTreeNode } from './type';

export default class NoteTree {
  private readonly remote = container.resolve(remoteToken);
  private readonly id = Symbol();
  @observable roots: NoteTreeNode[] = [];
  @observable readonly expandedNodes = new Set<NoteTreeNode['key']>();
  @observable readonly selectedNodes = new Set<NoteTreeNode['key']>();
  @observable readonly loadedNodes = new Set<NoteTreeNode['key']>();
  @observable readonly sortOptions = {
    by: SortBy.Title,
    order: SortOrder.Asc,
  };

  private readonly nodesMap: Record<Note['id'], NoteTreeNode> = {};

  private get _roots() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.options?.virtualRoot ? this.roots[0]!.children : this.roots;
  }

  private set _roots(nodes: NoteTreeNode[]) {
    if (this.options?.virtualRoot) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.roots[0]!.children = nodes;
    } else {
      this.roots = nodes;
    }
  }

  constructor(private readonly options?: { virtualRoot?: boolean; isDisabled?: (node: NoteTreeNode) => boolean }) {
    makeObservable(this);

    if (options?.virtualRoot) {
      this.initVirtualRoot();
    }
  }

  @action
  private initVirtualRoot() {
    const virtualRoot: NoteTreeNode = {
      key: VIRTUAL_ROOT_NODE_KEY,
      title: '根',
      children: [],
      isLeaf: false,
      treeId: this.id,
      note: getEmptyNote(),
    };

    if (this.options?.isDisabled) {
      virtualRoot.disabled = this.options.isDisabled(virtualRoot);
    }

    this.roots.push(virtualRoot);
    this.expandedNodes.add(VIRTUAL_ROOT_NODE_KEY);
    this.loadedNodes.add(VIRTUAL_ROOT_NODE_KEY);
  }

  private createNode(note: Note, noSort?: boolean) {
    const parent = note.parentId ? this.getNode(note.parentId) : undefined;
    const node: NoteTreeNode = observable({
      key: note.id,
      title: normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
      children: [],
      parent,
      note,
      treeId: this.id,
      disabled: false,
    });

    if (this.options?.isDisabled) {
      node.disabled = this.options.isDisabled(node);
    }

    if (parent) {
      parent.isLeaf = false;
    }

    const children = this.getChildren(note.parentId);

    children.push(node);

    if (!noSort) {
      this.sort(children, false);
    }

    this.nodesMap[note.id] = node;

    return node;
  }

  getNode(id: NoteTreeNode['key'] | Note['id'], noThrow: true): NoteTreeNode | undefined;
  getNode(id: NoteTreeNode['key'] | Note['id']): NoteTreeNode;
  @action.bound getNode(id: NoteTreeNode['key'] | Note['id'], noThrow?: true) {
    const node = this.nodesMap[id];

    if (!node && !noThrow) {
      throw new Error(`can not find node ${id}`);
    }

    return node;
  }

  hasNode(id: NoteTreeNode['key'] | Note['id']) {
    return Boolean(this.nodesMap[id]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has(node: any): node is NoteTreeNode {
    return node && 'treeId' in node && node.treeId === this.id;
  }

  private readonly loadTreeFragment = async (id: Note['id'] | NoteTreeNode['key']) => {
    const { body: fragment } = await this.remote.get<void, Note[]>(`/notes/${id}/tree-fragment`);

    runInAction(() => {
      for (const note of fragment) {
        this.updateTreeByNote(note, true);
        this.loadedNodes.add(note.id);
      }

      const childrenGroups = uniq(fragment.map(({ parentId }) => this.getChildren(parentId)));

      for (const children of childrenGroups) {
        this.sort(children, false);
      }
    });
  };

  readonly loadChildren = async (parentId?: Note['id']) => {
    if (parentId ? this.loadedNodes.has(parentId) || !this.hasNode(parentId) : this._roots.length > 0) {
      return;
    }

    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId: parentId || null });

    runInAction(() => {
      for (const note of notes) {
        this.updateTreeByNote(note, true);
      }

      this.sort(this.getChildren(parentId), false);
      parentId && this.loadedNodes.add(parentId);
    });
  };

  @action.bound
  updateTreeByNote(note: Note, noSort?: boolean) {
    const node = this.getNode(note.id, true);

    if (!node) {
      return this.createNode(note, noSort);
    }

    Object.assign(node.note, note);
    node.title = normalizeTitle(note);

    if ((node.parent?.key || null) === note.parentId) {
      return node;
    }

    this.removeChild(node);

    const newParent = note.parentId ? this.getNode(note.parentId) : undefined;

    node.parent = newParent;

    if (newParent) {
      newParent.children.push(node);
      newParent.isLeaf = false;
    } else {
      this._roots.push(node);
    }

    if (!noSort) {
      this.sort(newParent ? newParent.children : this._roots, false);
    }

    return node;
  }

  readonly toggleExpand = async (noteId: Note['parentId'], load: boolean, flag?: boolean) => {
    if (noteId === VIRTUAL_ROOT_NODE_KEY || noteId === null) {
      return;
    }

    if (flag || !this.expandedNodes.has(noteId)) {
      if (load) {
        if (this.hasNode(noteId)) {
          await this.loadChildren(noteId);
        } else {
          await this.loadTreeFragment(noteId);
        }
      }

      let node: NoteTreeNode | undefined = this.getNode(noteId);
      runInAction(() => {
        while (node) {
          this.expandedNodes.add(node.key);
          node = node.parent;
        }
      });
    } else {
      runInAction(() => this.expandedNodes.delete(noteId));
    }
  };

  @action.bound
  collapseAll() {
    this.expandedNodes.clear();
  }

  @action.bound
  setSortOptions(key: SortBy | SortOrder) {
    let needResort = false;

    if (key === SortOrder.Asc || key === SortOrder.Desc) {
      needResort = this.sortOptions.order !== key;
      this.sortOptions.order = key;
    } else {
      needResort = this.sortOptions.by !== key;
      this.sortOptions.by = key;
    }

    if (needResort) {
      this.sort(this._roots, true);
    }
  }

  @action
  sort(children: NoteTreeNode[], recursive: boolean) {
    const flip = (result: number) => (result === 0 ? 0 : result > 0 ? -1 : 1);
    const compare = (v1: number | string, v2: number | string) => (v1 === v2 ? 0 : v1 > v2 ? 1 : -1);

    children.sort((node1, node2) => {
      let result: number;

      switch (this.sortOptions.by) {
        case SortBy.Title:
          result = compare(normalizeTitle(node1.note), normalizeTitle(node2.note));
          break;
        case SortBy.CreatedAt:
          result = compare(node1.note.userCreatedAt, node2.note.userCreatedAt);
          break;
        case SortBy.UpdatedAt:
          result = compare(node1.note.userUpdatedAt, node2.note.userUpdatedAt);
          break;
        default:
          throw new Error('');
      }

      return this.sortOptions.order === SortOrder.Asc ? result : flip(result);
    });

    if (recursive) {
      for (const child of children) {
        this.sort(child.children, true);
      }
    }
  }

  @action.bound
  toggleSelect(noteId: Note['id'] | Note['id'][], reset: boolean) {
    const ids = Array.isArray(noteId) ? noteId : [noteId];

    if (reset) {
      this.selectedNodes.clear();
      for (const id of ids) {
        this.selectedNodes.add(id);
      }

      return true;
    }

    let result = true;

    for (const id of ids) {
      if (this.selectedNodes.has(id)) {
        this.selectedNodes.delete(id);

        result = false;
      } else {
        this.selectedNodes.add(id);
      }
    }

    return result;
  }

  @action
  removeNodes(ids: NoteTreeNode['key'][]) {
    for (const id of ids) {
      const node = this.getNode(id);

      this.removeChild(node);

      delete this.nodesMap[id];
      this.selectedNodes.delete(id);
      this.expandedNodes.delete(id);
      this.loadedNodes.delete(id);
    }
  }

  @action
  private removeChild(child: NoteTreeNode) {
    const { parent } = child;

    if (parent) {
      pull(parent.children, child);

      if (parent.children.length === 0) {
        parent.isLeaf = true;
        this.toggleExpand(parent.key, false, false);
      }
    } else {
      pull(this._roots, child);
    }
  }

  getChildren(parentId: Note['parentId'] | undefined) {
    return parentId ? this.getNode(parentId).children : this._roots;
  }

  private getDescendants(id: Note['parentId']): NoteTreeNode[] {
    const children = this.getChildren(id);
    return [...children, ...children.flatMap((child) => this.getDescendants(child.key))];
  }

  getInvalidParents(id: Note['id']) {
    const node = this.getNode(id, true);

    if (!node) {
      return [id];
    }

    return [
      id,
      node.parent?.key || null,
      ...this.getDescendants(id).map(({ key }) => key),
      ...(node.parent ? [node.parent.key] : []),
    ];
  }

  getSiblings(noteId: Note['id']) {
    const { parentId } = this.getNode(noteId).note;

    return (parentId ? this.getNode(parentId).children : this.roots).filter(({ key }) => key !== noteId);
  }

  @action
  toggleStar(noteId: Note['id'], isStar: boolean) {
    const { note } = this.getNode(noteId);
    note.isStar = isStar;
  }
}
