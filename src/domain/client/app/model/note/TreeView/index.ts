import { action, autorun, computed } from 'mobx';
import z from 'zod';
import assert from 'assert';

import Tree from '#domain/client/shared/model/note/Tree';
import container from '#utils/singletonContainer';
import type { NoteVO } from '#domain/shared/model/note';
import DomainEventBus from '#domain/client/app/model/note/EventBus';

import { arrayOf, type MaybeArray } from '#utils/collection';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import Workbench from '../../Workbench';

export enum SortBy {
  TitleAsc = 'titleAsc',
  TitleDesc = 'titleDesc',
  UpdatedAtAsc = 'updatedAtAsc',
  UpdatedAtDesc = 'updatedAtDesc',
  CreatedAtAsc = 'createdAtAsc',
  CreatedAtDesc = 'createdAtDesc',
}

export enum IconDisplayMode {
  All = 'all',
  None = 'none',
  Custom = 'custom',
}

export default class TreeView {
  constructor() {
    this.tree = new Tree({
      sort: this.sort.bind(this),
    });

    this.domainEventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated],
      this.tree.updateNode.bind(this.tree),
    );

    autorun(this.autoHighlight.bind(this));
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly workbench = container.resolve(Workbench);

  public readonly settings = new PersistedMap(
    'note-tree-settings',
    z.object({
      sortBy: z.enum(SortBy).catch(SortBy.TitleAsc),
      iconDisplayMode: z.enum(IconDisplayMode).catch(IconDisplayMode.All),
    }),
  );

  public readonly tree;

  @computed
  public get canCollapse() {
    return this.tree.expandedNodeIds.size > 0;
  }

  @action.bound
  public collapseAll() {
    for (const nodeId of this.tree.expandedNodeIds) {
      const node = this.tree.get(nodeId);

      if (node && !node.isRoot) {
        node.toggleExpand(false);
      }
    }
  }

  private autoHighlight() {
    this.tree.highlight(this.workbench.currentEditor?.noteId ?? null);
  }

  public async disableDescendantsBy(movingNotes: MaybeArray<NoteVO>) {
    const notes = arrayOf(movingNotes);
    const noteIds = notes.map(({ id }) => id);
    const nodeIdToSetUnselect = new Set<string>();
    const collectDescendantIds = (nodeId: string) => {
      const node = this.tree.get(nodeId);

      if (node) {
        nodeIdToSetUnselect.add(node.id);
        const childIds = node.childrenQuery.result.data?.map(({ id }) => id) ?? [];

        for (const childId of childIds) {
          collectDescendantIds(childId);
        }
      }
    };

    for (const noteId of noteIds) {
      collectDescendantIds(noteId);
    }

    this.tree.setUnselectable(Array.from(nodeIdToSetUnselect));
  }

  private sort(entity1: NoteVO, entity2: NoteVO) {
    const sortBy = this.settings.get('sortBy');
    const FLAG = [SortBy.CreatedAtAsc, SortBy.TitleAsc, SortBy.UpdatedAtAsc].includes(sortBy) ? 1 : -1;

    if ([SortBy.TitleAsc, SortBy.TitleDesc].includes(sortBy)) {
      return entity1.title > entity2.title ? FLAG : -FLAG;
    }

    if ([SortBy.CreatedAtAsc, SortBy.CreatedAtDesc].includes(sortBy)) {
      return entity1.createdAt > entity2.createdAt ? FLAG : -FLAG;
    }

    if ([SortBy.UpdatedAtAsc, SortBy.UpdatedAtDesc].includes(sortBy)) {
      return entity1.updatedAt > entity2.updatedAt ? FLAG : -FLAG;
    }

    assert.fail('invalid sortBy');
  }
}
