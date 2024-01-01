import { container, singleton } from 'tsyringe';
import assert from 'assert';

import { token as remoteToken } from '@domain/common/infra/remote';
import { token as UIToken } from '@domain/app/infra/ui';

import type { NotesPatchDTO, NoteVO, NotePatchDTO } from '@shared/domain/model/note';
import { TileSplitDirections, Workbench } from '@domain/app/model/workbench';
import NoteEditor from '@domain/app/model/note/Editor';
import NoteExplorer from '@domain/app/model/note/Explorer';
import type { RecyclablesDTO } from '@shared/domain/model/recyclables';
import { EntityTypes } from '@shared/domain/model/entity';
import eventBus, { type ActionEvent, Events } from '@domain/app/model/note/eventBus';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/modals';
import TreeNode from '@domain/common/model/abstract/TreeNode';

@singleton()
export default class NoteService {
  constructor() {
    eventBus.on(Events.Action, this.handleAction);
  }
  private readonly remote = container.resolve(remoteToken);
  private readonly ui = container.resolve(UIToken);
  private readonly explorer = container.resolve(NoteExplorer);
  private readonly workbench = container.resolve(Workbench);

  get tree() {
    return this.explorer.tree;
  }

  public readonly createNote = async (parentId?: NoteVO['parentId']) => {
    const { body: note } = await this.remote.post<NotePatchDTO, NoteVO>('/notes', {
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
    const { body: note } = await this.remote.post<void, NoteVO>(`/notes?from=${targetId}`);

    this.tree.updateTree(note);
    this.tree.toggleSelect(note.id);
    this.workbench.openEntity({ entityId: note.id, entityType: EntityTypes.Note });
  }

  private async deleteNotes(ids: NoteVO['id'][]) {
    const locators = ids.map((id) => ({ entityId: id, entityType: EntityTypes.Note } as const));
    await this.remote.patch<RecyclablesDTO>(`/recyclables`, locators);
    this.tree.removeNodes(ids);
    this.ui.feedback({ type: 'success', content: '已移至回收站' });
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

    await this.remote.patch<NotesPatchDTO>('/notes', { ids, note: { parentId: targetId } });

    for (const id of ids) {
      eventBus.emit(Events.Updated, { id, parentId: targetId });
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
        return this.workbench.openEntity(this.tree.getNode(oneId).entityLocator, { newTab: true });
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
