import { container, singleton } from 'tsyringe';
import { Emitter } from 'strict-event-emitter';

import { token as remoteToken } from 'infra/remote';
import { token as UIToken } from 'infra/ui';
import type {
  NotesPatchDTO as NotesPatch,
  NoteVO as Note,
  ClientNoteQuery as NoteQuery,
  NotePatchDTO as NotePatch,
  DuplicateNoteDTO,
} from 'model/note';
import type { RecyclablesDTO } from 'model/Recyclables';
import { EntityTypes } from 'model/entity';
import NoteTree from 'model/note/Tree';

import { MULTIPLE_ICON_FLAG, type NoteMetadata } from 'model/note/MetadataForm';

import EditorService from './EditorService';
import { getIds } from 'utils/collection';
import type { SelectEvent } from 'model/abstract/Tree';

export enum NoteEvents {
  'Deleted' = 'noteTree.deleted',
  'Updated' = 'noteTree.updated',
}

@singleton()
export default class NoteService extends Emitter<{
  [NoteEvents.Deleted]: [Note['id'][]];
  [NoteEvents.Updated]: [Note[]];
}> {
  private readonly remote = container.resolve(remoteToken);
  private readonly ui = container.resolve(UIToken);
  readonly noteTree = new NoteTree();

  constructor() {
    super();
    container.registerInstance(NoteTree, this.noteTree);

    this.noteTree.on('nodeSelected', this.handleSelect);
    this.noteTree.on('nodeExpanded', this.loadChildren);
  }

  readonly fetchTreeFragment = async (id: Note['id']) => {
    const { body: fragment } = await this.remote.get<void, Note[]>(`/notes/${id}/tree-fragment`);
    return fragment;
  };

  readonly fetchChildren = async (parentId?: Note['parentId']) => {
    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId });
    return notes;
  };

  readonly loadChildren = async (parentId?: Note['parentId']) => {
    const notes = await this.fetchChildren(parentId);
    this.noteTree.setChildren(notes, parentId || null);
  };

  readonly createNote = async (parentId?: Note['parentId']) => {
    const { body: note } = await this.remote.post<NotePatch, Note>('/notes', {
      parentId: parentId || null,
    });

    if (parentId && !this.noteTree.getNode(parentId).isExpanded) {
      await this.noteTree.toggleExpand(parentId);
    }

    this.noteTree.updateTree(note);
    this.noteTree.toggleSelect(note.id);

    const { openEntity } = container.resolve(EditorService);
    openEntity({ type: EntityTypes.Note, id: note.id });
  };

  async duplicateNote(targetId: Note['id']) {
    const { body: note } = await this.remote.post<DuplicateNoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.noteTree.updateTree(note);
    this.noteTree.toggleSelect(note.id);
  }

  private readonly handleSelect = (id: Note['id'] | null, { multiple, reason }: SelectEvent) => {
    if (!id) {
      throw new Error('invalid id');
    }

    if (!multiple && reason !== 'drag') {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ type: EntityTypes.Note, id: id });
    }
  };

  async deleteNotes(ids: Note['id'][]) {
    await this.remote.patch<RecyclablesDTO>(`/recyclables`, { ids, type: EntityTypes.Note });
    this.noteTree.removeNodes(ids);
    this.ui.feedback({ type: 'success', content: '已移至回收站' });
    this.emit(NoteEvents.Deleted, ids);
  }

  readonly moveNotes = async (targetId: Note['parentId'], ids?: Note['id'][]) => {
    const _ids = ids || getIds(this.noteTree.selectedNodes);

    const { body: updatedNotes } = await this.remote.patch<NotesPatch, Note[]>(
      '/notes',
      _ids.map((id) => ({ id, parentId: targetId })),
    );

    this.noteTree.updateTree(updatedNotes);

    const targetNode = targetId ? this.noteTree.getNode(targetId, true) : undefined;

    this.ui.feedback({
      type: 'success',
      content: `移动成功${targetId === null || targetNode?.isExpanded ? '' : '。点击定位到新位置'}`,
      onClick: targetId
        ? async () => {
            await this.noteTree.toggleExpand(targetId);
            this.noteTree.setSelected(_ids);
          }
        : undefined,
    });

    this.emit(NoteEvents.Updated, updatedNotes);
  };

  async editNotes(metadata: NoteMetadata) {
    const result: NotesPatch = this.noteTree.selectedNodes.map(({ id }) => ({
      id,
      ...metadata,
      isReadonly: metadata.isReadonly === 2 ? undefined : Boolean(metadata.isReadonly),
      icon: metadata.icon === MULTIPLE_ICON_FLAG ? undefined : (metadata.icon as string | null | undefined),
    }));

    const { body: notes } = await this.remote.patch<NotesPatch, Note[]>('/notes', result);
    this.noteTree.updateTree(notes);
    this.emit(NoteEvents.Updated, notes);
  }
}
