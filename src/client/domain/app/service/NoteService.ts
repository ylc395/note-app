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

  private get tree() {
    return this.explorer.tree;
  }

  public readonly createNote = async (params?: { parentId?: NoteVO['parentId']; from?: NoteVO['id'] }) => {
    const note = await this.remote.note.create.mutate(params || {});

    this.tree.updateTree(note);
    await this.tree.reveal(note.parentId, true);
    this.tree.toggleSelect(note.id, { value: true });
    this.workbench.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  public readonly getNoteIds = (item: unknown) => {
    if (item instanceof TreeNode) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof NoteEditor) {
      return [item.entityLocator.entityId];
    }
  };

  private async moveNotes(targetId: NoteVO['parentId'], itemIds: NoteVO['id'][]) {
    const notes = await this.remote.note.batchUpdate.mutate([itemIds, { parentId: targetId }]);
    this.tree.updateTree(notes);

    await this.tree.reveal(targetId, true);
    this.tree.setSelected(itemIds);

    for (const id of itemIds) {
      eventBus.emit(Events.Updated, { id, parentId: targetId });
    }
  }

  private async moveNotesByUserInput() {
    const targetId = await this.ui.prompt(MOVE_TARGET_MODAL);

    if (targetId === undefined) {
      return;
    }

    await this.moveNotes(targetId, this.tree.getSelectedNodeIds());
  }

  public readonly moveNotesByItems = async (targetId: NoteVO['parentId'], items: unknown) => {
    const ids = this.getNoteIds(items);
    assert(ids);

    await this.moveNotes(targetId, ids);
  };

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'duplicate':
        return this.createNote({ from: oneId });
      case 'move':
        return this.moveNotesByUserInput();
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
