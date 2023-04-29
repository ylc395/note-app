import { makeObservable, observable, action, runInAction } from 'mobx';
import pull from 'lodash/pull';
import uniq from 'lodash/uniq';

import type { EntityId } from 'interface/entity';

interface TreeNodeEntity {
  id: EntityId;
  parentId: EntityId | null;
}

export interface TreeNode<T extends TreeNodeEntity> {
  key: string;
  title: string;
  children: this[];
  isLeaf: boolean;
  isDisabled?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
  isLoaded?: boolean;
  isUndroppable?: boolean;
  treeId: symbol;
  entity: T;
}

export const VIRTUAL_ROOT_NODE_KEY = 'root';

export interface TreeOptions<T extends TreeNodeEntity> {
  roots?: TreeNode<T>[];
  virtualRoot?: boolean;
  isDisabled?: (entity: T, tree: Tree<T>) => boolean;
  fetchTreeFragment?: (noteId: TreeNode<T>['key']) => Promise<T[]>;
  fetchChildren?: (noteId: TreeNode<T>['key'] | null) => Promise<T[]>;
}

export abstract class Tree<T extends TreeNodeEntity> {
  @observable readonly expandedNodes = new Set<TreeNode<T>>();
  @observable roots: TreeNode<T>[] = [];
  @observable readonly selectedNodes = new Set<TreeNode<T>>();
  protected readonly id = Symbol();
  protected readonly nodesMap: Record<TreeNode<T>['key'], TreeNode<T>> = {};

  protected get _roots() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.options.virtualRoot ? this.roots[0]!.children : this.roots;
  }

  private set _roots(nodes: TreeNode<T>[]) {
    if (this.options.virtualRoot) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.roots[0]!.children = nodes;
    } else {
      this.roots = nodes;
    }
  }

  constructor(private readonly options: TreeOptions<T>) {
    makeObservable(this);

    if (options.virtualRoot) {
      this.initVirtualRoot();
    }

    if (options.roots) {
      this._roots = options.roots.map((node) => ({
        ...node,
        treeId: this.id,
        children: [],
        isSelected: false,
        isLeaf: true,
      }));
    }
  }

  protected abstract getEmptyEntity(): T;

  protected getVirtualRoot(): TreeNode<T> {
    return observable({
      key: VIRTUAL_ROOT_NODE_KEY,
      title: '根',
      children: [],
      isLeaf: false,
      treeId: this.id,
      isExpanded: true,
      isLoaded: true,
      entity: this.getEmptyEntity(),
    });
  }

  @action
  private initVirtualRoot() {
    const virtualRoot = this.getVirtualRoot();

    if (this.options.isDisabled) {
      virtualRoot.isDisabled = this.options.isDisabled(virtualRoot.entity, this);
    }

    this.nodesMap[virtualRoot.key] = virtualRoot;
    this.roots.push(virtualRoot);
  }

  getNode(id: TreeNode<T>['key'], noThrow: true): TreeNode<T> | undefined;
  getNode(id: TreeNode<T>['key']): TreeNode<T>;
  getNode(id: TreeNode<T>['key'], noThrow?: true) {
    const node = this.nodesMap[id];

    if (!node && !noThrow) {
      throw new Error(`can not find node ${id}`);
    }

    return node;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasNode(node: any): node is TreeNode<T> {
    return node && 'treeId' in node && node.treeId === this.id;
  }

  @action.bound
  collapseAll() {
    for (const node of Object.values(this.nodesMap)) {
      (node as TreeNode<T>).isExpanded = false;
    }
    this.expandedNodes.clear();
  }

  @action
  removeNodes(ids: TreeNode<T>['key'][]) {
    for (const id of ids) {
      const node = this.getNode(id);

      this.removeChild(node);

      delete this.nodesMap[id];
    }
  }

  getParentNode(node: TreeNode<T> | T) {
    if ('parentId' in node) {
      return node.parentId ? this.getNode(node.parentId) : undefined;
    }

    return node.entity.parentId ? this.getNode(node.entity.parentId) : undefined;
  }

  @action
  private removeChild(child: TreeNode<T>) {
    const parent = this.getParentNode(child);

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

  abstract sort(children: TreeNode<T>[], recursive: boolean): void;

  private readonly loadTreeFragment = async (id: TreeNode<T>['key']) => {
    if (!this.options.fetchTreeFragment) {
      throw new Error('can not fetch fragment');
    }

    const fragment = await this.options.fetchTreeFragment(id);

    runInAction(() => {
      for (const note of fragment) {
        const node = this.updateTreeByEntity(note, true);
        node.isLoaded = true;
      }

      const childrenGroups = uniq(fragment.map(({ parentId }) => parentId)).map(this.getChildren.bind(this));

      for (const children of childrenGroups) {
        this.sort(children, false);
      }
    });
  };

  readonly loadChildren = async (parentNode?: TreeNode<T>) => {
    if (!this.options.fetchChildren) {
      throw new Error('can not fetch fragment');
    }

    const parentId = parentNode?.key || null;
    const notes = await this.options.fetchChildren(parentId);

    runInAction(() => {
      for (const note of notes) {
        this.updateTreeByEntity(note, true);
      }

      this.sort(this.getChildren(parentId), false);
      parentNode && (parentNode.isLoaded = true);
    });
  };

  readonly toggleExpand = async (nodeId: TreeNode<T>['key'] | null, load: boolean, flag?: boolean) => {
    if (nodeId === VIRTUAL_ROOT_NODE_KEY || nodeId === null) {
      return;
    }

    const node = this.getNode(nodeId, true);

    if (flag || !node?.isExpanded) {
      if (load) {
        if (node) {
          await this.loadChildren(node);
        } else {
          await this.loadTreeFragment(nodeId);
        }
      }

      runInAction(() => {
        let node = this.getNode(nodeId, true);
        while (node) {
          node.isExpanded = true;
          this.expandedNodes.add(node);
          node = this.getParentNode(node);
        }
      });
    } else {
      runInAction(() => {
        node.isExpanded = false;
        this.expandedNodes.delete(node);
      });
    }
  };

  getChildren(parentId: T['parentId'] | undefined) {
    return parentId ? this.getNode(parentId).children : this._roots;
  }

  protected abstract entityToNode(entity: T): Partial<TreeNode<T>>;

  @action
  private createNode(entity: T, noSort?: boolean) {
    const node: TreeNode<T> = observable({
      key: entity.id,
      title: '',
      isLeaf: true,
      children: [],
      entity,
      treeId: this.id,
      isDisabled: this.options.isDisabled?.(entity, this) ?? false,
      ...this.entityToNode(entity),
    });

    const parent = this.getParentNode(node);

    if (parent) {
      parent.isLeaf = false;
    }

    const siblings = this.getChildren(entity.parentId);

    siblings.push(node);
    this.nodesMap[entity.id] = node;

    if (!noSort) {
      this.sort(siblings, false);
    }

    return node;
  }

  @action.bound
  updateTreeByEntity(entity: T, noSort?: boolean) {
    const node = this.getNode(entity.id, true);

    if (!node) {
      return this.createNode(entity, noSort);
    }

    const parent = this.getParentNode(node);

    if ((parent?.key || null) !== entity.parentId) {
      this.removeChild(node);
      const newParent = entity.parentId ? this.getNode(entity.parentId) : undefined;

      if (newParent) {
        newParent.children.push(node);
        newParent.isLeaf = false;
      } else {
        this._roots.push(node);
      }

      if (!noSort) {
        this.sort(newParent ? newParent.children : this._roots, false);
      }
    }

    Object.assign(node, this.entityToNode(entity));
    node.entity = entity;

    return node;
  }

  getSiblings(id: TreeNode<T>['key']) {
    const { parentId } = this.getNode(id).entity;

    return (parentId ? this.getNode(parentId).children : this.roots).filter(({ key }) => key !== id);
  }

  @action.bound
  toggleSelect(nodeId: TreeNode<T>['key'] | TreeNode<T>['key'][], reset: boolean) {
    const ids = Array.isArray(nodeId) ? nodeId : [nodeId];

    if (reset) {
      for (const node of this.selectedNodes) {
        node.isSelected = false;
      }

      this.selectedNodes.clear();

      for (const id of ids) {
        const node = this.getNode(id);

        this.selectedNodes.add(node);
        node.isSelected = true;
      }

      return true;
    }

    for (const id of ids) {
      const node = this.getNode(id);
      node.isSelected = !node.isSelected;

      if (node.isSelected) {
        this.selectedNodes.add(node);
      } else {
        this.selectedNodes.delete(node);
      }
    }
  }

  getSelectedIds() {
    return Array.from(this.selectedNodes).map(({ key }) => key);
  }
}
