import { container } from 'tsyringe';
import { action, makeObservable, observable, runInAction } from 'mobx';
import pull from 'lodash/pull';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { NoteQuery, NoteVO as Note } from 'interface/Note';
import NoteEditor from 'model/editor/NoteEditor';

interface NoteTreeNode {
  key: string;
  title: string;
  note: Note;
  parent?: NoteTreeNode;
  children: NoteTreeNode[];
  isLeaf: boolean;
}

export default class NoteTree {
  @observable roots: NoteTreeNode[] = [];
  private readonly nodesMap: Record<Note['id'], NoteTreeNode> = {};
  private readonly remote = container.resolve<Remote>(remoteToken);
  constructor() {
    makeObservable(this);
  }

  getNote = (id: Note['id']) => {
    const node = this.nodesMap[id];

    if (!node) {
      throw new Error('no such node');
    }

    return node.note;
  };

  private noteToNode(note: Note) {
    const parent = note.parentId ? this.nodesMap[note.parentId] : undefined;

    if (note.parentId && !parent) {
      throw new Error('fail to find parent');
    }

    const node = observable({
      key: note.id,
      title: NoteEditor.normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
      children: [],
      parent,
      note,
    });

    this.nodesMap[note.id] = node;

    return node;
  }

  loadChildren = async (noteId?: Note['id']) => {
    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId: noteId || null });
    const nodes = notes.map(this.noteToNode.bind(this));

    runInAction(() => {
      if (noteId) {
        const targetNode = this.nodesMap[noteId];

        if (!targetNode) {
          throw new Error('no node');
        }

        targetNode.children = nodes;
      } else {
        this.roots = nodes;
      }
    });
  };

  @action.bound
  updateTreeByNote(note: Note) {
    const node = this.nodesMap[note.id];

    if (!node) {
      const newNode = this.noteToNode(note);
      const children = note.parentId ? this.nodesMap[note.parentId]?.children : this.roots;

      if (!children) {
        throw new Error('no children');
      }

      children.push(newNode);
      return;
    }

    node.note = note;
    node.title = NoteEditor.normalizeTitle(note);

    const oldParent = node.parent;

    if (oldParent && oldParent.key !== note.parentId) {
      pull(oldParent.children, node);

      if (note.parentId) {
        const newParent = this.nodesMap[note.parentId];

        if (!newParent) {
          throw new Error('can not find new parent');
        }

        node.parent = newParent;
        newParent.children.push(node);
        newParent.isLeaf = false;
      }
    }
  }
}
