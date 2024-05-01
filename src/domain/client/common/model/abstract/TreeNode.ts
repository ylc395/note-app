import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx';
import assert from 'assert';

import type { HierarchyEntity } from '@domain/shared/model/entity';
import Tree from './Tree';

export default abstract class TreeNode<T extends HierarchyEntity = HierarchyEntity> {
  constructor({ entity, tree }: { entity: T | null; tree: Tree<T> }) {
    this.entity = entity || null;
    this.tree = tree;

    // this means it's a root node
    if (!entity) {
      this.isExpanded = true;
    }

    makeObservable(this);

    // this can be gc-ed in theory, so we don't dispose it manually
    reaction(
      () => this.entity,
      action((entity) => Object.assign(this, this._entityToNode(entity))),
      { fireImmediately: true },
    );
  }

  public tree: Tree<T>;

  public get isRoot() {
    return !this.entity;
  }

  public get id() {
    return this.entity?.id || '__ROOT_ID';
  }

  public get descendants(): TreeNode<T>[] {
    return [...this.children, ...this.children.flatMap((child) => child.descendants)];
  }

  public get ancestors() {
    let parent = this.parent;
    const ancestors: TreeNode<T>[] = [];

    while (parent && parent.parent) {
      ancestors.unshift(parent);
      parent = parent.parent;
    }

    return ancestors;
  }

  public async loadChildren() {
    if (this.isLoading) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });

    const entities = await this.tree.queryChildren(this.entity?.id || null);

    runInAction(() => {
      this.tree.updateTreeByEntity(entities);
      this.isLoading = false;
      this.isLoaded = true;
    });
  }

  @action
  public toggleExpand(config?: { value?: boolean; noLoad?: boolean }) {
    let toggled: boolean;

    if (typeof config?.value === 'boolean') {
      toggled = this.isExpanded !== config.value;
      this.isExpanded = config.value;
    } else {
      toggled = true;
      this.isExpanded = !this.isExpanded;
    }

    if (this.isExpanded && toggled && !this.isLeaf && !config?.noLoad) {
      this.loadChildren();
    }

    return this.isExpanded;
  }

  @action
  public toggleSelect(options?: { isMultiple?: boolean; value?: boolean }) {
    if (this.isDisabled) {
      return;
    }

    const oldValue = this.isSelected;

    if (oldValue === options?.value) {
      return;
    }

    if (!options?.isMultiple) {
      for (const selected of this.tree.selectedNodes) {
        selected.isSelected = false;
      }
    }

    this.isSelected = !oldValue;
  }

  public get entityLocator() {
    assert(this.entity);

    return {
      entityType: this.tree.entityType,
      entityId: this.entity.id,
      mimeType:
        'mimeType' in this.entity && typeof this.entity.mimeType === 'string' ? this.entity.mimeType : undefined,
    };
  }

  public get parent(): TreeNode<T> | null {
    return this.entity ? this.tree.getNode(this.entity.parentId) : null;
  }

  public abstract readonly entityToNode?: (
    entity: T | null,
  ) => Partial<Pick<TreeNode, 'title' | 'isDisabled' | 'icon' | 'isExpanded'>>;

  private _entityToNode(entity: T | null) {
    return { ...this.entityToNode?.(entity), ...this.tree.options?.entityToNode?.(entity, this.tree) };
  }

  @observable public entity: T | null; // only root node has no entity;
  @observable public isDisabled = false;
  @observable public title = '';
  @observable public icon: string | null = null;
  @observable.shallow public children: TreeNode<T>[] = [];

  @computed public get isLeaf() {
    return this.entity?.childrenCount === 0;
  }

  @computed public get sortedChildren() {
    const sort = this.tree.options?.sort;

    if (!sort) {
      return this.children;
    }

    return this.children.toSorted(({ entity: e1 }, { entity: e2 }) => sort(e1!, e2!));
  }
  @observable public isExpanded = false;
  @observable public isSelected = false;
  @observable public isLoading = false;
  public isLoaded = false;
}
