import { container, singleton } from 'tsyringe';
import assert from 'assert';

import { token as rpcToken } from '@domain/common/infra/rpc';

import type { NoteVO } from '@shared/domain/model/note';
import { Workbench } from '@domain/app/model/workbench';
import NoteEditor from '@domain/app/model/note/Editor';
import NoteExplorer from '@domain/app/model/note/Explorer';
import { EntityTypes } from '@shared/domain/model/entity';
import { type ActionEvent, eventBus, Events } from '@domain/app/model/note/eventBus';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/prompts';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import MoveBehavior from '../model/abstract/behaviors/MoveBehavior';

@singleton()
export default class NoteService {
  constructor() {
    eventBus.on(Events.Action, this.handleAction);
  }
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);
  public readonly move = new MoveBehavior({
    tree: this.tree,
    promptToken: MOVE_TARGET_MODAL,
    itemsToIds: NoteService.getNoteIds,
    onMove: async (parentId, ids) => {
      await this.remote.note.batchUpdate.mutate([ids, { parentId }]);
      ids.forEach((id) => eventBus.emit(Events.Updated, { trigger: this.move, parentId, id }));
    },
  });

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

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'duplicate':
        return this.createNote({ from: oneId });
      case 'move':
        return this.move.byUserInput();
      default:
        assert.fail(`invalid action: ${action}`);
    }
  };

  public static getNoteIds(item: unknown) {
    if (item instanceof TreeNode && item.entityLocator.entityType === EntityTypes.Note) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof NoteEditor) {
      return [item.entityLocator.entityId];
    }
  }
}
