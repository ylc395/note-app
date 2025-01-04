import { action, computed, autorun } from 'mobx';
import { compact } from 'lodash-es';
import { z } from 'zod';

import Tree from '#domain/client/shared/model/note/Tree';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';

import SortBehavior from './SortBehavior';
import UIState from '../../common/UIState';
import { type UpdatedEvent, eventBus as domainEventBus, EventNames } from '../eventBus';
import type { NoteVO } from '#domain/shared/model/note';

export default class Explorer {
  constructor() {
    this.init();
  }

  protected readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = new SortBehavior();

  public readonly tree = new Tree();

  public readonly uiState = new UIState(
    'explorer',
    z
      .object({
        scroll: z.object({ x: z.number(), y: z.number() }),
        expanded: z.string().array(),
        loaded: z.string().array(),
        selected: z.string().array(),
      })
      .partial(),
  );

  private async init() {
    domainEventBus.on(EventNames.Updated, this.handleNoteUpdated.bind(this));
    domainEventBus.on(EventNames.Created, this.tree.addNode.bind(this));
    domainEventBus.on(EventNames.Removed, this.tree.removeNode.bind(this));
    autorun(this.updateUIState.bind(this));

    await this.tree.root.load();

    if (this.uiState.value?.loaded) {
      await this.tree.load(this.uiState.value.loaded);
    }

    if (this.uiState.value?.expanded) {
      await this.tree.expand(this.uiState.value.expanded);
    }

    if (this.uiState.value?.selected) {
      this.tree.select(this.uiState.value.selected);
    }
  }

  @computed
  public get canCollapse() {
    return this.tree.expandedNodes.length > 0;
  }

  @action.bound
  public collapseAll() {
    for (const node of this.tree.expandedNodes) {
      node.toggleExpand(false);
    }
  }

  private updateUIState() {
    const getId = ({ id }: TreeNode) => id;

    this.uiState.update({
      loaded: this.tree.loadedNodes.map(getId),
      selected: this.tree.selectedNodes.map(getId),
      expanded: this.tree.expandedNodes.map(getId),
    });
  }

  private handleNoteUpdated({ id, payload }: UpdatedEvent) {
    this.tree.update({ id, ...payload });
  }

  public async updateUnselectable(from: NoteVO[]) {
    for (const node of this.tree.unselectableNodes) {
      node.isUnselectable = false;
    }

    const noteIds = from.map(({ id }) => id);
    const unknownNodes = noteIds.filter((id) => !this.tree.hasNode(id));
    const unknownAncestors = unknownNodes.length > 0 ? await this.remote.note.queryPaths.query(unknownNodes) : {};

    for (const movingId of noteIds) {
      let nodeToDisable: TreeNode[];

      if (this.tree.hasNode(movingId)) {
        const movingNode = this.tree.getNode(movingId);
        nodeToDisable = [...movingNode.ancestors, movingNode];
      } else {
        nodeToDisable = compact(
          unknownAncestors[movingId]?.map(({ id }) => this.tree.hasNode(id) && this.tree.getNode(id)) || [],
        );
      }

      for (const ancestor of nodeToDisable) {
        ancestor.isUnselectable = true;
      }
    }
  }
}
