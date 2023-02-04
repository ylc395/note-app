import { action, makeObservable, observable } from 'mobx';
import pull from 'lodash/pull';

import type { NoteVO as Note } from 'interface/Note';
import { normalizeTitle } from 'interface/Note';

interface NoteTreeNode {
  key: string;
  title: string;
  note: Note;
  parent?: NoteTreeNode;
  children: NoteTreeNode[];
  isLeaf: boolean;
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

export default class NoteTree {
  @observable roots: NoteTreeNode[] = [];
  @observable readonly expandedNodes = new Set<NoteTreeNode['key']>();
  @observable readonly selectedNodes = new Set<NoteTreeNode['key']>();
  @observable readonly loadedNodes = new Set<NoteTreeNode['key']>();
  @observable readonly sortOptions = {
    by: SortBy.Title,
    order: SortOrder.Asc,
  };
  private readonly nodesMap: Record<Note['id'], NoteTreeNode> = {};
  constructor() {
    makeObservable(this);
  }

  private noteToNode(note: Note) {
    const parent = note.parentId ? this.nodesMap[note.parentId] : undefined;

    if (note.parentId && !parent) {
      throw new Error('fail to find parent');
    }

    const node = observable({
      key: note.id,
      title: normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
      children: [],
      parent,
      note,
    });

    this.nodesMap[note.id] = node;

    return node;
  }

  getNode(id: string) {
    const node = this.nodesMap[id];

    if (!node) {
      throw new Error('can not find node');
    }

    return node;
  }

  @action
  loadChildren(children: Note[], note?: Note) {
    const noteId = note?.id;
    const nodes = children.map(this.noteToNode.bind(this));

    this.sort(nodes, false);
    noteId && this.loadedNodes.add(noteId);

    if (noteId) {
      const targetNode = this.nodesMap[noteId];

      if (!targetNode) {
        throw new Error('no node');
      }

      targetNode.children = nodes;
      targetNode.isLeaf = nodes.length === 0;
    } else {
      this.roots = nodes;
    }
  }

  @action.bound
  updateTreeByNote(note: Note) {
    const node = this.nodesMap[note.id];

    if (!node) {
      const newNode = this.noteToNode(note);
      const parent = note.parentId && this.nodesMap[note.parentId];
      const children = parent ? parent.children : this.roots;

      if (parent) {
        parent.isLeaf = false;
      }

      children.push(newNode);
      this.sort(children, false);
      return;
    }

    Object.assign(node.note, note);
    node.title = normalizeTitle(note);

    const oldParent = node.parent;
    const newParent = note.parentId && this.nodesMap[note.parentId];

    if (oldParent && oldParent.key !== note.parentId) {
      pull(oldParent.children, node);

      if (newParent) {
        node.parent = newParent;
        newParent.children.push(node);
        newParent.isLeaf = false;
      } else {
        node.parent = undefined;
        this.roots.push(node);
      }
    }

    this.sort(newParent ? newParent.children : this.roots, false);
  }

  @action.bound
  toggleExpand(note: Note, flag?: boolean) {
    const noteId = note.id;

    if (flag || !this.expandedNodes.has(noteId)) {
      this.expandedNodes.add(noteId);
    } else {
      this.expandedNodes.delete(noteId);
    }
  }

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
      this.sort(this.roots, true);
    }

    console.log(this.roots);
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
  toggleSelect(note: Note, reset: boolean) {
    const nodeId = note.id;

    if (reset) {
      this.selectedNodes.clear();
      this.selectedNodes.add(nodeId);

      return true;
    }

    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId);

      return false;
    } else {
      this.selectedNodes.add(nodeId);
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
        pull(this.roots, node);
      }

      this.selectedNodes.delete(id);
      this.expandedNodes.delete(id);
      this.loadedNodes.delete(id);
    }
  }
}
