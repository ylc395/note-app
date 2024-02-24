import { action, makeObservable, observable, runInAction } from 'mobx';
import { differenceWith, map } from 'lodash-es';
import assert from 'assert';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import type Tree from './Tree';

export default class TreeNode<T extends HierarchyEntity = HierarchyEntity> {
  constructor(public readonly tree: Tree<T>, entity?: T) {
    if (!entity) {
      this.isLeaf = false;
      this.isExpanded = true;
    }

    this.parent = entity ? tree.getNode(entity.parentId) : null;
    this.entity = entity || null;

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

    if (entities.length === 0) {
      this.isLeaf = true;
    } else {
      this.tree.updateTree(entities);
    }
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

  @observable.ref public parent: TreeNode<T> | null; // only root node has no parent;
  @observable public entity: T | null; // only root node has no entity;
  @observable public isDisabled = false;
  @observable public title = '';
  @observable public isLeaf = true;
  @observable public icon: string | null = null;
  @observable.shallow public children: TreeNode<T>[] = [];
  @observable public isExpanded = false;
  @observable public isSelected = false;
  @observable public isLoading = false;
}
