import { container, singleton } from 'tsyringe';
import { Emitter } from 'strict-event-emitter';
import assert from 'assert';

import { token as remoteToken } from 'infra/remote';
import { token as UIToken } from 'infra/ui';
import type {
  NotesPatchDTO as NotesPatch,
  NoteVO as Note,
  ClientNoteQuery as NoteQuery,
  NotePatchDTO as NotePatch,
  DuplicateNoteDTO,
} from 'model/note';
import type { RecyclablesDTO } from 'model/recyclables';
import { EntityTypes } from 'model/entity';
import Explorer from 'model/Explorer';
import type { SelectEvent } from 'model/abstract/Tree';

import { MULTIPLE_ICON_FLAG, type NoteMetadata } from 'model/note/MetadataForm';

import EditorService from './EditorService';
import { getLocators } from 'utils/collection';

@singleton()
export default class NoteService extends Emitter<{
  deleted: [Note['id'][]];
  updated: [Note[]];
}> {
  private readonly remote = container.resolve(remoteToken);
  private readonly ui = container.resolve(UIToken);
  private readonly explorer = container.resolve(Explorer);
  private readonly editorService = container.resolve(EditorService);

  get tree() {
    return this.explorer.noteTree;
  }

  constructor() {
    super();

    this.tree.on('nodeSelected', this.handleSelect);
    this.tree.on('nodeExpanded', this.loadChildren);
  }

  readonly loadChildren = async (parentId?: Note['parentId']) => {
    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId });
    this.tree.updateChildren(parentId || null, notes);
  };

  readonly createNote = async (parentId?: Note['parentId']) => {
    const { body: note } = await this.remote.post<NotePatch, Note>('/notes', {
      parentId: parentId || null,
    });

    this.tree.updateTree(note);

    if (parentId && !this.tree.getNode(parentId).isExpanded) {
      this.tree.toggleExpand(parentId);
    }

    this.tree.toggleSelect(note.id);
    this.editorService.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  async duplicateNote(targetId: Note['id']) {
    const { body: note } = await this.remote.post<DuplicateNoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.tree.updateTree(note);
    this.tree.toggleSelect(note.id);
  }

  private readonly handleSelect = ({ id, multiple, reason }: SelectEvent) => {
    assert(id);

    if (!multiple && reason !== 'drag') {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ entityType: EntityTypes.Note, entityId: id });
    }
  };

  async deleteNotes(ids: Note['id'][]) {
    await this.remote.patch<RecyclablesDTO>(`/recyclables`, getLocators(ids, EntityTypes.Note));
    this.tree.removeNodes(ids);
    this.ui.feedback({ type: 'success', content: '已移至回收站' });
    this.emit('deleted', ids);
  }

  readonly moveNotes = async (targetId: Note['parentId'], ids?: Note['id'][]) => {
    const _ids = ids || this.tree.selectedNodeIds;

    const { body: updatedNotes } = await this.remote.patch<NotesPatch, Note[]>('/notes', {
      ids: _ids,
      note: { parentId: targetId },
    });

    this.tree.updateTree(updatedNotes);

    const targetNode = this.tree.getNode(targetId, true);

    this.ui.feedback({
      type: 'success',
      content: `移动成功${targetId === null || targetNode?.isExpanded ? '' : '。点击定位到新位置'}`,
      onClick: targetId
        ? async () => {
            await this.tree.toggleExpand(targetId);
            this.tree.setSelected(_ids);
          }
        : undefined,
    });

    this.emit('updated', updatedNotes);
  };

  async editNotes(metadata: NoteMetadata) {
    const { body: notes } = await this.remote.patch<NotesPatch, Note[]>('/notes', {
      ids: this.tree.selectedNodeIds,
      note: {
        ...metadata,
        isReadonly: metadata.isReadonly === 2 ? undefined : Boolean(metadata.isReadonly),
        icon: metadata.icon === MULTIPLE_ICON_FLAG ? undefined : (metadata.icon as string | null | undefined),
      },
    });

    this.tree.updateTree(notes);
    this.emit('updated', notes);
  }
}
