import { container, singleton } from 'tsyringe';
import pick from 'lodash/pick';
import EventEmitter from 'eventemitter3';

import { token as remoteToken } from 'infra/Remote';
import { noteDomainInputToken, commonOutputToken } from 'infra/UI';

import { type NoteDTO, type NoteVO as Note, type NotesDTO, normalizeTitle, NoteQuery } from 'interface/Note';
import type { RecyclablesDTO } from 'interface/Recyclables';
import { EntityTypes } from 'interface/entity';

import { MULTIPLE_ICON_FLAG, type NoteMetadata } from 'model/note/MetadataForm';
import NoteTree from 'model/note/Tree';
import type { NoteTreeNode } from 'model/note/Tree/type';

import StarService, { StarEvents } from './StarService';
import EditorService from './EditorService';

export enum NoteEvents {
  'Deleted' = 'noteTree.deleted',
  'Updated' = 'noteTree.updated',
}

@singleton()
export default class NoteService extends EventEmitter {
  private readonly remote = container.resolve(remoteToken);
  private readonly editor = container.resolve(EditorService);
  private readonly star = container.resolve(StarService);
  private readonly userFeedback = container.resolve(commonOutputToken);
  private readonly userInput = container.resolve(noteDomainInputToken);

  constructor() {
    super();
    this.star.on(StarEvents.NoteAdded, (noteId) => this.noteTree.toggleStar(noteId, true));
    this.star.on(StarEvents.NoteRemoved, (noteId) => this.noteTree.toggleStar(noteId, false));
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
    let { body: note } = await this.remote.post<NoteDTO, Note>('/notes', {
      parentId: parentId || null,
    });

    if (parentId) {
      await this.noteTree.toggleExpand(parentId, true, true);
    }

    note = this.noteTree.updateTreeByEntity(note).entity;
    this.noteTree.toggleSelect(note.id, true);
    this.editor.openEntity({ entityType: EntityTypes.Note, entityId: note.id });
  };

  async duplicateNote(targetId: Note['id']) {
    const { body: note } = await this.remote.post<NoteDTO, Note>('/notes', { duplicateFrom: targetId });

    this.noteTree.updateTreeByEntity(note);
    this.noteTree.toggleSelect(note.id, true);
  }

  readonly selectNote = (node: NoteTreeNode, multiple: boolean) => {
    const selected = this.noteTree.toggleSelect(node.key, !multiple);

    if (selected && !multiple) {
      this.editor.openEntity({ entityType: EntityTypes.Note, entityId: node.key });
    }
  };

  async deleteNotes(ids: Note['id'][]) {
    await this.remote.put<RecyclablesDTO>(`/recyclables/notes`, { ids });
    this.noteTree.removeNodes(ids);
    this.userFeedback.message.success({ content: '已移至回收站' });
    this.emit(NoteEvents.Deleted, ids);
  }

  readonly moveNotes = async (ids: Note['id'][], targetId?: Note['parentId']) => {
    const nodesToMove = ids.map((id) => this.noteTree.getNode(id));

    targetId = targetId === undefined ? await this.userInput.getMoveTargetNoteId(nodesToMove) : targetId;

    if (targetId === undefined) {
      return;
    }

    const notes = ids.map((id) => ({ id, parentId: targetId }));
    const { body: updatedNotes } = await this.remote.patch<NotesDTO, Note[]>('/notes', notes);

    const targetNode = targetId ? this.noteTree.getNode(targetId, true) : undefined;

    if (targetId && !targetNode) {
      this.noteTree.removeNodes(ids);
    } else {
      for (const note of updatedNotes) {
        this.noteTree.updateTreeByEntity(note, true);
      }

      this.noteTree.sort(targetNode ? targetNode.children : this.noteTree.roots, false);
    }

    this.userFeedback.message.success({
      content: `移动成功${targetId === null || targetNode?.isExpanded ? '' : '。点击定位到新位置'}`,
      onClick: async (close) => {
        close();

        if (targetId === undefined) {
          return;
        }

        await this.noteTree.toggleExpand(targetId, true, true);
        this.noteTree.toggleSelect(ids, true);
      },
    });

    this.emit(NoteEvents.Updated, updatedNotes);
  };

  async editNotes(ids: Note['id'][]) {
    const notesToEdit = ids.map((id) => this.noteTree.getNode(id).entity);
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

    const updatedNoteMetadata = await this.userInput.editNoteMetadata(noteMetadata, {
      length: notesToEdit.length,
      title: notesToEdit.length === 1 ? normalizeTitle(firstNote) : '',
      icons: notesToEdit.map(({ icon }) => icon),
    });

    if (!updatedNoteMetadata) {
      return;
    }

    const result: NotesDTO = notesToEdit.map(({ id }) => ({
      id,
      ...updatedNoteMetadata,
      isReadonly: updatedNoteMetadata.isReadonly === 2 ? undefined : Boolean(updatedNoteMetadata.isReadonly),
      icon:
        updatedNoteMetadata.icon === MULTIPLE_ICON_FLAG
          ? undefined
          : (updatedNoteMetadata.icon as string | null | undefined),
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
