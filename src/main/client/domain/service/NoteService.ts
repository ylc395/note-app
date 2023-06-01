import { container, singleton } from 'tsyringe';
import pick from 'lodash/pick';
import { Emitter } from 'strict-event-emitter';

import { token as remoteToken } from 'infra/remote';
import { token as UIToken } from 'infra/ui';

import type { NoteDTO, NoteVO as Note, NotesDTO, NoteQuery } from 'interface/Note';
import type { RecyclablesDTO } from 'interface/Recyclables';
import { EntityTypes } from 'interface/entity';

import { MULTIPLE_ICON_FLAG, type NoteMetadata } from 'model/note/MetadataForm';
import NoteTree from 'model/note/Tree';

import StarService, { StarEvents } from './StarService';
import EditorService from './EditorService';

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

  constructor() {
    super();
    this.init();
  }

  private init() {
    const starService = container.resolve(StarService);
    starService.on(StarEvents.Added, ({ ids, type }) => {
      if (type === EntityTypes.Note) {
        ids.forEach((noteId) => this.noteTree.toggleStar(noteId, true));
      }
    });
    starService.on(StarEvents.Removed, ({ id, type }) => {
      if (type === EntityTypes.Note) {
        this.noteTree.toggleStar(id, false);
      }
    });
  }

  readonly fetchChildren = async (parentId: Note['parentId']) => {
    const { body: notes } = await this.remote.get<NoteQuery, Note[]>('/notes', { parentId });
    return notes;
  };

  readonly fetchTreeFragment = async (id: Note['id']) => {
    const { body: fragment } = await this.remote.get<void, Note[]>(`/notes/${id}/tree-fragment`);
    return fragment;
  };

  readonly noteTree = new NoteTree({
    fetchChildren: this.fetchChildren,
    fetchTreeFragment: this.fetchTreeFragment,
  });

  readonly createNote = async (parentId?: Note['parentId']) => {
    // fixme: knex 有个 bug，目前必须写一个字段进去 https://github.com/knex/knex/pull/5471
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', {
      parentId: parentId || null,
    });

    if (parentId) {
      await this.noteTree.toggleExpand(parentId, true, true);
    }

    this.noteTree.updateTreeByEntity(note);
    this.noteTree.toggleSelect(note.id, true);

    const { openEntity } = container.resolve(EditorService);
    openEntity({ type: EntityTypes.Note, id: note.id });
  };

  async duplicateNote(targetId: Note['id']) {
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.noteTree.updateTreeByEntity(note);
    this.noteTree.toggleSelect(note.id, true);
  }

  readonly selectNote = (note: Note, multiple: boolean) => {
    this.noteTree.toggleSelect(note.id, !multiple);

    if (!multiple) {
      const { openEntity } = container.resolve(EditorService);
      openEntity({ type: EntityTypes.Note, id: note.id });
    }
  };

  async deleteNotes(ids: Note['id'][]) {
    await this.remote.put<RecyclablesDTO>(`/recyclables/notes`, { ids });
    this.noteTree.removeNodes(ids);
    this.ui.feedback({ type: 'success', content: '已移至回收站' });
    this.emit(NoteEvents.Deleted, ids);
  }

  readonly moveNotes = async (targetId: Note['parentId'], ids?: Note['id'][]) => {
    const _ids = ids || this.noteTree.getSelectedIds();

    const { body: updatedNotes } = await this.remote.patch<NotesDTO, Note[]>(
      '/notes',
      _ids.map((id) => ({ id, parentId: targetId })),
    );

    const targetNode = targetId ? this.noteTree.getNode(targetId, true) : undefined;

    if (targetId && (!targetNode || !targetNode.isLoaded)) {
      this.noteTree.removeNodes(_ids);
    } else {
      for (const note of updatedNotes) {
        this.noteTree.updateTreeByEntity(note, true);
      }

      this.noteTree.sort(targetNode ? targetNode.children : this.noteTree.roots, false);
    }

    this.ui.feedback({
      type: 'success',
      content: `移动成功${targetId === null || targetNode?.isExpanded ? '' : '。点击定位到新位置'}`,
      onClick: async () => {
        if (targetId === undefined) {
          return;
        }

        await this.noteTree.toggleExpand(targetId, true, true);
        this.noteTree.toggleSelect(_ids, true);
      },
    });

    this.emit(NoteEvents.Updated, updatedNotes);
  };

  readonly getSelectedMetadata = () => {
    const notesToEdit = this.noteTree.getSelectedIds().map((id) => this.noteTree.getNode(id).entity);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstNote = notesToEdit[0]!;
    const noteMetadata: NoteMetadata =
      notesToEdit.length > 1
        ? {
            icon: MULTIPLE_ICON_FLAG,
            isReadonly: notesToEdit.reduce((result, { isReadonly }) => {
              if (result === 2) {
                return result;
              }

              return result !== Number(isReadonly) ? 2 : (Number(isReadonly) as 0 | 1);
            }, Number(firstNote.isReadonly) as NoteMetadata['isReadonly']),
          }
        : {
            ...pick(firstNote, ['icon', 'userCreatedAt', 'userUpdatedAt', 'attributes']),
            isReadonly: Number(firstNote.isReadonly) as NoteMetadata['isReadonly'],
          };

    return noteMetadata;
  };

  async editNotes(metadata: NoteMetadata) {
    const result: NotesDTO = this.noteTree.getSelectedIds().map((id) => ({
      id,
      ...metadata,
      isReadonly: metadata.isReadonly === 2 ? undefined : Boolean(metadata.isReadonly),
      icon: metadata.icon === MULTIPLE_ICON_FLAG ? undefined : (metadata.icon as string | null | undefined),
    }));

    const { body: notes } = await this.remote.patch<NotesDTO, Note[]>('/notes', result);
    const parentIds = new Set<Note['parentId']>();

    for (const note of notes) {
      this.noteTree.updateTreeByEntity(note, true);
      parentIds.add(note.parentId);
    }

    for (const parentId of parentIds) {
      this.noteTree.sort(this.noteTree.getChildren(parentId), false);
    }

    this.emit(NoteEvents.Updated, notes);
  }
}