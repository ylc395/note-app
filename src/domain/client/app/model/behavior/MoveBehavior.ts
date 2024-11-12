import assert from 'assert';
import { action, observable, makeObservable, computed } from 'mobx';
import { compact } from 'lodash-es';
import { container, singleton } from 'tsyringe';

import type { EntityParentId, EntityTypes, HierarchyEntity } from '#domain/shared/model/entity';
import type { EntityLocator } from '#domain/client/app/model/entity';
import Explorer from '#domain/client/app/model/abstract/Explorer';
import Tree from '#domain/client/common/model/abstract/Tree';
import ExplorerManager from '#domain/client/app/model/ExplorerManager';
import TreeNode from '#domain/client/common/model/abstract/TreeNode';
import Editor from '#domain/client/app/model/abstract/Editor';
import EventBus from '#domain/client/app/infra/EventBus';

export enum Events {
  Move = 'move',
}

interface TargetEntityLocator {
  entityType: EntityTypes;
  entityId: EntityParentId;
}

export interface MoveEvent {
  items: EntityLocator[];
  target: TargetEntityLocator;
}

@singleton()
export default class MoveBehavior extends EventBus<{
  [Events.Move]: MoveEvent;
}> {
  private readonly explorerManager = container.resolve(ExplorerManager);

  constructor() {
    super('move');
    makeObservable(this);
  }

  @observable.ref
  public targetTree?: Tree;

  @observable.ref
  private movingEntities?: EntityLocator[];

  @observable
  private mode?: 'select' | 'drag';

  @computed
  public get isDraggingMoving() {
    return this.mode === 'drag';
  }

  private disableInvalidMoveTargetInExplorer(movingEntities: EntityLocator[]) {
    for (const explorer of this.explorerManager.all) {
      if (!(explorer instanceof Explorer)) {
        continue;
      }

      const { tree, entityType: explorerEntityType } = explorer;

      if (movingEntities.some(({ entityType }) => explorerEntityType !== entityType)) {
        for (const node of tree.allNodes) {
          node.isDisabled = true;
        }
        continue;
      }

      const nodes = compact(movingEntities.map(({ entityId }) => tree.getNode(entityId, true)));

      for (const node of nodes) {
        node.isDisabled = true;

        for (const descendant of node.descendants) {
          descendant.isDisabled = true;
        }
      }
    }
  }

  private resetExplorers() {
    for (const explorer of this.explorerManager.all) {
      if (!(explorer instanceof Explorer)) {
        continue;
      }

      for (const node of explorer.tree.allNodes) {
        node.isDisabled = false;
      }
    }
  }

  private itemToEntities(item: unknown) {
    let entities: EntityLocator[] | null = null;

    if (item instanceof TreeNode) {
      entities = item.tree.selectedNodes.map((node) => node.entityLocator);
    }

    if (item instanceof Tree) {
      entities = item.selectedNodes.map((node) => node.entityLocator);
    }

    if (item instanceof Editor) {
      entities = [item.entityLocator];
    }

    assert(entities, 'can not get moving entities from item');
    return entities;
  }

  @action.bound
  public startMoving<T extends HierarchyEntity>({
    mode,
    item,
    from,
  }: {
    mode: 'drag' | 'select';
    item: unknown;
    from?: Tree<T>;
  }) {
    const movingEntities = this.itemToEntities(item);
    this.movingEntities = movingEntities;
    this.mode = mode;

    if (mode === 'drag') {
      this.disableInvalidMoveTargetInExplorer(movingEntities);
    }

    if (mode === 'select') {
      assert(from, 'a source explorer is required');
      this.targetTree = this.createTargetTree(from as unknown as Tree);
    }
  }

  @action.bound
  public finishMoving() {
    if (!this.targetTree) {
      this.resetExplorers();
    }

    this.movingEntities = undefined;
    this.targetTree = undefined;
    this.mode = undefined;
  }

  public moveTo = async (target?: TargetEntityLocator) => {
    assert(this.movingEntities, 'no movingEntities');
    target = target || this.getTargetFromTargetTree();

    this.emit(Events.Move, { target, items: this.movingEntities });
    this.finishMoving();
  };

  private getTargetFromTargetTree() {
    assert(this.targetTree);

    const node = this.targetTree.getSelectedNode();
    return { entityType: this.targetTree.entityType, entityId: node.isRoot ? null : node.id };
  }

  private createTargetTree(from: Tree) {
    const movingNodes = from.selectedNodes;
    const ids = movingNodes.map(({ id }) => id);
    const parentIds = movingNodes.map(({ entity }) => entity!.parentId);

    const isNodeDisabled = (entity: HierarchyEntity | null, tree: Tree) => {
      if (!entity) {
        return parentIds.includes(null);
      }

      if ([...parentIds, ...ids].includes(entity.id)) {
        return true;
      }

      return tree.getNode(entity.parentId).ancestors.some((node) => node.isDisabled);
    };

    const targetTree = from.clone({
      entityToNode: (entity, tree) => ({ isDisabled: isNodeDisabled(entity, tree) }),
    });

    targetTree.root.loadChildren();

    return targetTree;
  }
}
