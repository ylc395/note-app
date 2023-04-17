import { Injectable, Inject } from '@nestjs/common';
import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';
import intersection from 'lodash/intersection';

import { Transaction } from 'infra/Database';
import { buildIndex } from 'utils/collection';
import {
  type NoteVO,
  type NoteBodyDTO,
  type NoteDTO,
  type NoteQuery,
  type NotesDTO,
  type NotePath,
  type NoteBodyVO,
  normalizeTitle,
} from 'interface/note';
import { EntityTypes } from 'interface/entity';
import BaseService from './BaseService';
import RevisionService from './RevisionService';

export const events = {
  bodyUpdated: 'updated.content.note',
};

export interface NoteBodyUpdatedEvent {
  id: NoteVO['id'];
  type: EntityTypes.Note;
  content: NoteBodyVO;
}

@Injectable()
export default class NoteService extends BaseService {
  @Inject() private readonly revisionService!: RevisionService;

  @Transaction
  async create(note: NoteDTO) {
    if (note.parentId && !(await this.areAvailable(note.parentId))) {
      throw new Error('invalid parentId');
    }

    if (note.duplicateFrom) {
      return await this.duplicate(note.duplicateFrom);
    }

    return await this.notes.create(note);
  }

  private async duplicate(noteId: NoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('note unavailable');
    }

    const targetNote = await this.notes.findOneById(noteId);
    const targetNoteBody = await this.notes.findBody(noteId);

    if (!targetNote || targetNoteBody === null) {
      throw new Error('invalid duplicate target');
    }

    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.notes.create(
      omit(targetNote, ['id', 'userCreatedAt', 'userUpdatedAt', 'createdAt', 'updatedAt']),
    );

    await this.notes.updateBody(noteId, targetNoteBody);
    return newNote;
  }

  @Transaction
  async update(noteId: NoteVO['id'], note: NoteDTO) {
    await this.assertValidChanges([{ ...note, id: noteId }]);

    const result = await this.notes.update(noteId, note);

    if (!result) {
      throw new Error('invalid id');
    }

    return result;
  }

  @Transaction
  async updateBody(noteId: NoteVO['id'], { content, isImportant }: NoteBodyDTO) {
    if (!(await this.isWritable(noteId))) {
      throw new Error('note unavailable');
    }

    const result = await this.notes.updateBody(noteId, content);

    if (result === null) {
      throw new Error('update note body failed');
    }

    if (isImportant) {
      this.revisionService.createRevision({ content, type: EntityTypes.Note, id: noteId }, true);
    }

    this.eventEmitter.emit(events.bodyUpdated, {
      id: noteId,
      type: EntityTypes.Note,
      content,
    } as NoteBodyUpdatedEvent);

    return result;
  }

  @Transaction
  async getBody(noteId: NoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('note unavailable');
    }

    const result = await this.notes.findBody(noteId);

    if (result === null) {
      throw new Error('note unavailable');
    }

    return result;
  }

  @Transaction
  async batchUpdate(notes: NotesDTO) {
    await this.assertValidChanges(notes);
    const result = await this.notes.batchUpdate(notes);

    if (result.length !== notes.length) {
      throw new Error('invalid notes');
    }

    return result;
  }

  async query(q: NoteQuery) {
    const notes = await this.notes.findAll(q);
    const areRecyclables = await this.recyclables.areRecyclable(
      EntityTypes.Note,
      notes.map((note) => note.id),
    );

    return notes.filter((note) => !areRecyclables[note.id]);
  }

  @Transaction
  async getTreeFragment(noteId: NoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('invalid id');
    }

    const notes = await this.notes.findTreeFragment(noteId);
    const parents = groupBy(notes, 'parentId');
    const result: NoteVO[] = notes.filter(({ parentId }) => parentId === null);

    for (let i = 0; result[i]; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { id } = result[i]!;
      const children = parents[id];

      if (children) {
        result.push(...children);
      }
    }

    return result;
  }

  // todo: unused, maybe remove
  async getTreePath(noteId: NoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('invalid id');
    }

    const notes = await this.notes.findTreeFragment(noteId);
    const notesIndex = buildIndex(notes);

    let currentNote: NoteVO | undefined = notesIndex[noteId];
    const path: NotePath = [];

    while (currentNote) {
      path.unshift({
        id: currentNote.id,
        title: normalizeTitle(currentNote),
        icon: currentNote.icon,
        siblings: notes
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .filter(({ parentId, id }) => id !== currentNote!.id && parentId === currentNote!.parentId)
          .map((note) => ({ ...note, title: normalizeTitle(note) })),
      });

      currentNote = currentNote.parentId ? notesIndex[currentNote.parentId] : undefined;
    }

    return path;
  }

  private async assertValidChanges(notes: NotesDTO) {
    const ids = notes.map(({ id }) => id);

    if (!(await this.areAvailable(ids))) {
      throw new Error('invalid ids');
    }

    const parentChangedNotes = notes.filter((parent) => typeof parent !== undefined);

    if (parentChangedNotes.length === 0) {
      return;
    }

    for (const { parentId, id } of parentChangedNotes) {
      if (parentId === id) {
        throw new Error(`invalid parent id: ${parentId}`);
      }
    }

    const parentChangedNoteIds = parentChangedNotes.map(({ id }) => id);
    const descendantIds = await this.notes.findAllDescendantIds(parentChangedNoteIds);
    const invalidParentIds = intersection(
      descendantIds,
      parentChangedNotes.map(({ parentId }) => parentId).filter((id) => id),
    );

    if (invalidParentIds.length > 0) {
      throw new Error(`invalid parent id: ${invalidParentIds.join()}`);
    }
  }

  async getAttributes() {
    return this.notes.findAttributes();
  }

  async areAvailable(noteIds: NoteVO['id'][] | NoteVO['id']) {
    if (Array.isArray(noteIds)) {
      const rows = await this.notes.findAll({ id: noteIds });

      if (rows.length !== noteIds.length) {
        return false;
      }

      const areRecyclables = Object.values(await this.recyclables.areRecyclable(EntityTypes.Note, noteIds));
      return areRecyclables.every((v) => v === false);
    }

    return (
      Boolean(await this.notes.findOneById(noteIds)) &&
      !(await this.recyclables.isRecyclable({ type: EntityTypes.Note, id: noteIds }))
    );
  }

  async isWritable(noteId: NoteVO['id']) {
    const row = await this.notes.findOneById(noteId);

    if (!row) {
      return false;
    }

    return !(await this.recyclables.isRecyclable({ type: EntityTypes.Note, id: noteId }));
  }

  async putIntoRecyclable(ids: NoteVO['id'][]) {
    if (!this.areAvailable(ids)) {
      throw new Error('not available');
    }

    const allIds = [...ids, ...(await this.notes.findAllDescendantIds(ids))];
    return await this.recyclables.put(EntityTypes.Note, allIds);
  }
}
