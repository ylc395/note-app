import { action, makeObservable, observable, runInAction } from 'mobx';
import pull from 'lodash/pull';
import { container } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';
import type { NoteQuery, NoteVO as Note } from 'interface/Note';
import { normalizeTitle } from 'interface/Note';

export interface NoteTreeNode {
  key: string;
  title: string;
  note: Note;
  parent?: NoteTreeNode;
  children: NoteTreeNode[];
  isLeaf: boolean;
  disabled?: boolean;
}

export enum SortBy {
  Title = 'title',
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export const VIRTUAL_ROOT_NODE_KEY = 'root';

export default class NoteTree {
  private readonly remote = container.resolve(remoteToken);
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
      note: {
        id: '',
        title: '',
        isReadonly: true,
        parentId: null,
        icon: null,
        childrenCount: 0,
        updatedAt: 0,
        userCreatedAt: 0,
        createdAt: 0,
        userUpdatedAt: 0,
      },
    };

    if (this.options?.isDisabled) {
      virtualRoot.disabled = this.options.isDisabled(virtualRoot);
    }

    this.roots.push(virtualRoot);
    this.expandedNodes.add(VIRTUAL_ROOT_NODE_KEY);
  }

  private noteToNode(note: Note) {
    const parent = note.parentId ? this.getNode(note.parentId) : undefined;
    const node = observable({
      key: note.id,
      title: normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
      children: [],
      parent,
      note,
      disabled: false,
    });

    if (this.options?.isDisabled) {
      node.disabled = this.options.isDisabled(node);
    }

    this.nodesMap[note.id] = node;

    return node;
  }

  getNode(id: string, noThrow: true): NoteTreeNode | undefined;
  getNode(id: string): NoteTreeNode;
  getNode(id: string, noThrow?: true) {
    const node = this.nodesMap[id];

    if (!node && !noThrow) {
      throw new Error('can not find node');
    }

    return node;
  }

  readonly loadChildren = async (parentId?: Note['id']) => {
    if (parentId && this.loadedNodes.has(parentId)) {
      return;
    }

    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId: parentId || null });

    runInAction(() => {
      const nodes = notes.map(this.noteToNode.bind(this));

      this.sort(nodes, false);
      parentId && this.loadedNodes.add(parentId);

      if (parentId) {
        const targetNode = this.nodesMap[parentId];

        // todo: 需要支持读取任意 node，哪怕它并不在树上
        if (!targetNode) {
          throw new Error('no node');
        }

        targetNode.children = nodes;
        targetNode.isLeaf = nodes.length === 0;
      } else {
        this._roots = nodes;
      }
    });
  };

  @action.bound
  updateTreeByNote(note: Note) {
    const node = this.nodesMap[note.id];

    if (!node) {
      const newNode = this.noteToNode(note);
      const parent = note.parentId && this.nodesMap[note.parentId];
      const children = parent ? parent.children : this._roots;

      if (parent) {
        parent.isLeaf = false;
      }

      children.push(newNode);
      this.sort(children, false);

      return newNode;
    }

    Object.assign(node.note, note);
    node.title = normalizeTitle(note);

    const oldParent = node.parent;
    const newParent = note.parentId && this.nodesMap[note.parentId];

    if (oldParent?.key !== note.parentId) {
      pull(oldParent ? oldParent.children : this._roots, node);

      if (newParent) {
        node.parent = newParent;
        newParent.children.push(node);
        newParent.isLeaf = false;
      } else {
        node.parent = undefined;
        this._roots.push(node);
      }
    }

    this.sort(newParent ? newParent.children : this._roots, false);
    return node;
  }

  readonly toggleExpand = async (noteId: Note['id'], load: boolean, flag?: boolean) => {
    if (noteId === VIRTUAL_ROOT_NODE_KEY) {
      return;
    }

    if (flag || !this.expandedNodes.has(noteId)) {
      let node: NoteTreeNode | undefined = this.getNode(noteId);
      load && (await this.loadChildren(noteId));
      runInAction(() => {
        while (node) {
          this.expandedNodes.add(noteId);
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
  private sort(children: NoteTreeNode[], recursive: boolean) {
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
  toggleSelect(noteId: Note['id'], reset: boolean) {
    if (reset) {
      this.selectedNodes.clear();
      this.selectedNodes.add(noteId);

      return true;
    }

    if (this.selectedNodes.has(noteId)) {
      this.selectedNodes.delete(noteId);

      return false;
    } else {
      this.selectedNodes.add(noteId);
      return true;
    }
  }

  @action
  removeNodes(ids: NoteTreeNode['key'][]) {
    for (const id of ids) {
      const node = this.getNode(id);
      const parentNode = node.parent;

      if (parentNode) {
        pull(parentNode.children, node);

        if (parentNode.children.length === 0) {
          parentNode.isLeaf = true;
        }

        node.parent = undefined;
      } else {
        pull(this._roots, node);
      }

      this.selectedNodes.delete(id);
      this.expandedNodes.delete(id);
      this.loadedNodes.delete(id);
    }
  }
}
