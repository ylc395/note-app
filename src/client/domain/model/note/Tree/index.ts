import { action, makeObservable, observable } from 'mobx';

import type { NoteVO as Note } from 'interface/Note';
import { normalizeTitle } from 'interface/Note';
import { Tree } from 'model/abstract/Tree';

import { SortBy, SortOrder } from './constants';
import type { NoteTreeNode } from './type';

export * from './constants';

export default class NoteTree extends Tree<Note> {
  @observable readonly invalidParentKeys = new Set<NoteTreeNode['key'] | null>();
  @observable readonly sortOptions = {
    by: SortBy.Title,
    order: SortOrder.Asc,
  };

  protected updateNodeByEntity(note: Note, node: NoteTreeNode) {
    super.updateNodeByEntity(note, node);
    node.title = normalizeTitle(note);
  }

  @action.bound
  setSortOptions(key: SortOrder | SortBy) {
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

  constructor(options: {
    roots?: NoteTreeNode[];
    virtualRoot?: boolean;
    isDisabled?: (node: NoteTreeNode) => boolean;
    fetchTreeFragment?: (noteId: Note['id']) => Promise<Note[]>;
    fetchChildren?: (noteId: Note['parentId']) => Promise<Note[]>;
  }) {
    super(options);
    makeObservable(this);
  }

  protected entityToNode(note: Note) {
    return {
      title: normalizeTitle(note),
      isLeaf: note.childrenCount === 0,
    };
  }

  protected getEmptyEntity() {
    return {
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
      isStar: false,
      attributes: {},
    };
  }

  @action
  sort(children: NoteTreeNode[], recursive: boolean) {
    const flip = (result: number) => (result === 0 ? 0 : result > 0 ? -1 : 1);
    const compare = (v1: number | string, v2: number | string) => (v1 === v2 ? 0 : v1 > v2 ? 1 : -1);

    children.sort((node1, node2) => {
      let result: number;

      switch (this.sortOptions.by) {
        case SortBy.Title:
          result = compare(normalizeTitle(node1.entity), normalizeTitle(node2.entity));
          break;
        case SortBy.CreatedAt:
          result = compare(node1.entity.userCreatedAt, node2.entity.userCreatedAt);
          break;
        case SortBy.UpdatedAt:
          result = compare(node1.entity.userUpdatedAt, node2.entity.userUpdatedAt);
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

  private getDescendants(id: Note['parentId']): NoteTreeNode[] {
    const children = this.getChildren(id);
    return [...children, ...children.flatMap((child) => this.getDescendants(child.key))];
  }

  @action.bound
  updateInvalidParentNodes(id?: Note['id']) {
    for (const key of this.invalidParentKeys) {
      if (key) {
        delete this.getNode(key).isUndroppable;
      }
    }
    this.invalidParentKeys.clear();

    const selectedKeys = id ? [id] : Array.from(this.selectedNodes).map(({ key }) => key);
    const invalidParentNodes: Set<NoteTreeNode | null> = new Set();
    const invalidDescendantNodes: Set<NoteTreeNode> = new Set();

    for (const key of selectedKeys) {
      const node = this.getNode(key);

      invalidParentNodes.add(node.parent || null);
      invalidDescendantNodes.add(node);

      for (const descendant of this.getDescendants(key)) {
        invalidDescendantNodes.add(descendant);
      }
    }

    if (invalidParentNodes.size === 1) {
      for (const parentNode of invalidParentNodes) {
        if (parentNode) {
          parentNode.isUndroppable = true;
          this.invalidParentKeys.add(parentNode.key);
        } else {
          this.invalidParentKeys.add(null);
        }
      }
    }

    for (const descendantNode of invalidDescendantNodes) {
      descendantNode.isUndroppable = true;
      this.invalidParentKeys.add(descendantNode.key);
    }
  }

  @action
  toggleStar(noteId: Note['id'], isStar: boolean) {
    const { entity } = this.getNode(noteId);
    entity.isStar = isStar;
  }

  getFragmentFromSelected() {
    return new NoteTree({ roots: Array.from(this.selectedNodes) });
  }
}
