import { action, makeObservable, observable, runInAction } from 'mobx';
import assert from 'assert';
import { container } from 'tsyringe';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import { token } from '@domain/common/infra/rpc';
import Tree from './Tree';

export default abstract class TreeNode<T extends HierarchyEntity = HierarchyEntity> {
  protected remote = container.resolve(token);
  constructor({ entity, tree }: { entity: T | null; tree: Tree<T> }) {
    if (!entity) {
      this.isLeaf = false;
      this.isExpanded = true;
    }

    this.entity = entity || null;
    this.tree = tree;

    makeObservable(this);
  }

  public tree: Tree<T>;

  protected abstract fetchChildren(): Promise<T[]>;

  protected get isRoot() {
    return this.id === '__ROOT_ID';
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
    if (this.isLoading || this.isLoaded) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
    });

    const entities = await this.fetchChildren();

    runInAction(() => {
      this.tree.updateTree(entities);

      this.isLoading = false;
      this.isLoaded = true;

      if (entities.length === 0) {
        this.isLeaf = true;
      }
    });
  }

  @action
  public toggleExpand(value?: boolean) {
    let toggled: boolean;

    if (typeof value === 'boolean') {
      toggled = this.isExpanded !== value;
      this.isExpanded = value;
    } else {
      toggled = true;
      this.isExpanded = !this.isExpanded;
    }

    if (this.isExpanded && toggled && !this.isLeaf) {
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

  @observable public entity: T | null; // only root node has no entity;
  @observable public isDisabled = false;
  @observable public title = '';
  @observable public isLeaf = true;
  @observable public icon: string | null = null;
  @observable.shallow public children: TreeNode<T>[] = [];
  @observable public isExpanded = false;
  @observable public isSelected = false;
  @observable public isLoading = false;
  protected isLoaded = false;
}
