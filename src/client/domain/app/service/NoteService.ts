import { container, singleton } from 'tsyringe';
import assert from 'assert';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as UIToken } from '@shared/domain/infra/ui';

import type { NoteVO } from '@shared/domain/model/note';
import { TileSplitDirections, Workbench } from '@domain/app/model/workbench';
import NoteEditor from '@domain/app/model/note/Editor';
import NoteExplorer, { EventNames as ExplorerEvents, type ActionEvent } from '@domain/app/model/note/Explorer';
import { EntityTypes } from '@shared/domain/model/entity';
import { eventBus, Events } from '@domain/app/model/note/eventBus';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/modals';
import TreeNode from '@domain/common/model/abstract/TreeNode';

@singleton()
export default class NoteService {
  constructor() {
    this.explorer.on(ExplorerEvents.Action, this.handleAction);
  }
  private readonly remote = container.resolve(rpcToken);
  private readonly ui = container.resolve(UIToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);

  get tree() {
    return this.explorer.tree;
  }

  public readonly createNote = async (parentId?: NoteVO['parentId']) => {
    const note = await this.remote.note.create.mutate({
      parentId: parentId || null,
    });

    this.tree.updateTree(note);

    if (parentId) {
      this.tree.toggleExpand(parentId, true);
    }

    this.tree.toggleSelect(note.id);
    this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  private async duplicateNote(targetId: NoteVO['id']) {
    const note = await this.remote.note.create.mutate({ from: targetId });
    this.tree.updateTree(note);
    this.tree.toggleSelect(note.id);
    this.workbench.openEntity({ entityId: note.id, entityType: EntityTypes.Note });
  }

  public readonly getNoteIds = (item: unknown) => {
    if (item instanceof TreeNode) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof NoteEditor) {
      return [item.entityLocator.entityId];
    }
  };

  public readonly moveNotes = async ({ targetId, item }: { targetId: NoteVO['parentId']; item?: unknown }) => {
    const ids = this.getNoteIds(item) || this.tree.getSelectedNodeIds();

    await this.remote.note.batchUpdate.mutate([ids, { parentId: targetId }]);

    for (const id of ids) {
      eventBus.emit(Events.Updated, { id, actor: this, parentId: targetId });
    }

    if (targetId) {
      this.tree.toggleExpand(targetId, true);
    }
    this.tree.setSelected(ids);
  };

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'duplicate':
        return this.duplicateNote(oneId);
      case 'move':
        return this.ui.showModal(MOVE_TARGET_MODAL);
      case 'openInNewTab':
        return this.workbench.openEntity(this.tree.getNode(oneId).entityLocator, { forceNewTab: true });
      case 'openToTop':
      case 'openToBottom':
      case 'openToRight':
      case 'openToLeft':
        return this.workbench.openEntity(
          { entityType: EntityTypes.Note, entityId: oneId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { dest: { splitDirection: TileSplitDirections[action.match(/openTo(.+)/)![1] as any] as any } },
        );
      default:
        assert.fail(`invalid action: ${action}`);
    }
  };
}
