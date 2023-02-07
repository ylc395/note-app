import { Injectable, Inject } from '@nestjs/common';
import omit from 'lodash/omit';
import intersection from 'lodash/intersection';
import type Repositories from './repository';

import { Transaction, token as databaseToken, Database } from 'infra/Database';
import { NoteVO, NoteBodyDTO, NoteDTO, NoteQuery, normalizeTitle, NotesDTO } from 'interface/Note';

@Injectable()
export default class NoteService {
  private readonly notes: Repositories['notes'];

  constructor(@Inject(databaseToken) db: Database) {
    this.notes = db.getRepository('notes');
  }

  @Transaction
  async create(note: NoteDTO) {
    if (note.parentId && !(await this.notes.areAvailable([note.parentId]))) {
      throw new Error('invalid parentId');
    }

    if (note.duplicateFrom) {
      return await this.duplicate(note.duplicateFrom);
    }

    return await this.notes.create(note);
  }

  private async duplicate(noteId: NoteVO['id']) {
    if (!(await this.notes.areAvailable([noteId]))) {
      throw new Error('note unavailable');
    }

    const targetNote = (await this.notes.findAll({ id: noteId }))[0];
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
  async updateBody(noteId: NoteVO['id'], body: NoteBodyDTO) {
    if (!(await this.notes.isWritable(noteId))) {
      throw new Error('note unavailable');
    }

    const result = await this.notes.updateBody(noteId, body);

    if (!result) {
      throw new Error('update note body failed');
    }

    return result;
  }

  @Transaction
  async getBody(noteId: NoteVO['id']) {
    if (!(await this.notes.areAvailable([noteId]))) {
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

  @Transaction
  async query(q: NoteQuery) {
    return await this.notes.findAll(q);
  }

  @Transaction
  async getTreeFragment(noteId: NoteVO['id']) {
    if (!(await this.notes.areAvailable([noteId]))) {
      throw new Error('invalid id');
    }

    return await this.notes.findTreeFragment(noteId);
  }

  private async assertValidChanges(notes: NotesDTO) {
    const ids = notes.map(({ id }) => id);

    if (!(await this.notes.areAvailable(ids))) {
      throw new Error('invalid ids');
    }

    const parentChangedNotes = notes.filter((parent) => typeof parent !== undefined);

    for (const { parentId, id } of parentChangedNotes) {
      if (parentId === id) {
        throw new Error(`invalid parent id: ${parentId}`);
      }
    }

    const parentChangedNoteIds = parentChangedNotes.map(({ id }) => id);
    const descendantIds = await this.notes.findAllDescendantIds(parentChangedNoteIds);
    const invalidParentIds = intersection(descendantIds, parentChangedNoteIds);

    if (invalidParentIds.length > 0) {
      throw new Error(`invalid parent id: ${invalidParentIds.join()}`);
    }
  }
}
