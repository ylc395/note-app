import { action, makeObservable, observable, runInAction } from 'mobx';
import { differenceWith, map } from 'lodash-es';

import { HierarchyEntity } from '@shared/domain/model/entity';
import type Tree from './Tree';
import assert from 'assert';

export default class TreeNode<T extends HierarchyEntity> {
  constructor(
    public readonly tree: Tree<T>,
    options?: { parent: TreeNode<T>; entity: T; title?: string; isDisabled?: boolean; isLeaf?: boolean },
  ) {
    if (!options) {
      this.isLeaf = false;
      this.isExpanded = true;
    }

    this.parent = options?.parent || null;
    this.entity = options?.entity || null;
    this.title = options?.title ?? '';
    this.isDisabled = options?.isDisabled ?? false;
    this.isLeaf = options?.isLeaf ?? false;

    makeObservable(this);
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

    const childrenEntities = await this.tree.fetchChildren(this.entity ? this.id : null);
    this.updateChildren(childrenEntities);

    runInAction(() => {
      this.isLoading = false;
    });
  }

  @action
  private updateChildren(entities: T[]) {
    const toRemoveIds = map(
      differenceWith(this.children, entities, (a, b) => a.id === b.id),
      'id',
    );

    this.tree.removeNodes(toRemoveIds);
    this.tree.updateTree(entities);
  }

  public toEntityLocator() {
    assert(this.entity);

    return {
      entityType: this.tree.entityType,
      entityId: this.entity.id,
      mimeType:
        'mimeType' in this.entity && typeof this.entity.mimeType === 'string' ? this.entity.mimeType : undefined,
    };
  }
  @observable.ref public parent: TreeNode<T> | null; // only root node has no parent;
  @observable.ref public entity: T | null; // only root node has no entity;
  @observable public isDisabled;
  @observable public title;
  @observable public isLeaf;
  @observable.shallow public children: TreeNode<T>[] = [];
  @observable public isExpanded = false;
  @observable public isSelected = false;
  @observable public isLoading = false;
}
