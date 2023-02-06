import { Injectable, Inject } from '@nestjs/common';
import omit from 'lodash/omit';

import { Transaction } from 'infra/TransactionManager';
import { NoteVO, NoteBodyDTO, NoteDTO, NoteQuery, normalizeTitle, NotesDTO } from 'interface/Note';
import { token as noteRepositoryToken, type NoteRepository } from 'service/repository/NoteRepository';

@Injectable()
export default class NoteService {
  constructor(@Inject(noteRepositoryToken) private readonly notes: NoteRepository) {}

  @Transaction
  async create(note: NoteDTO) {
    if (note.parentId && !(await this.notes.isAvailable(note.parentId))) {
      throw new Error('invalid parentId');
    }

    if (note.duplicateFrom) {
      return await this.duplicate(note.duplicateFrom);
    }

    return await this.notes.create(note);
  }

  private async duplicate(noteId: NoteVO['id']) {
    if (!(await this.notes.isAvailable(noteId))) {
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
    if (!(await this.notes.isAvailable(noteId))) {
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
    return await this.notes.findAll(q);
  }

  private async assertValidChanges(notes: NotesDTO) {
    const ids = notes.map(({ id }) => id);

    if (!(await this.notes.isAvailable(ids))) {
      throw new Error('invalid ids');
    }

    // const parentChangedNotes = notes.filter(parent => typeof parent !== undefined);
  }
}
