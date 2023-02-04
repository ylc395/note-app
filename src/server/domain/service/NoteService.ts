import { Injectable, Inject } from '@nestjs/common';
import omit from 'lodash/omit';

import { NoteVO, NoteBodyDTO, NoteDTO, NoteQuery, normalizeTitle } from 'interface/Note';
import { token as noteRepositoryToken, type NoteRepository } from 'service/repository/NoteRepository';

@Injectable()
export default class NoteService {
  constructor(@Inject(noteRepositoryToken) private readonly repository: NoteRepository) {}

  async create(note: NoteDTO) {
    if (note.parentId && !(await this.repository.isAvailable(note.parentId))) {
      throw new Error('invalid parentId');
    }

    if (note.duplicateFrom) {
      return await this.duplicate(note.duplicateFrom);
    }

    return await this.repository.create(note);
  }

  private async duplicate(noteId: NoteVO['id']) {
    if (!(await this.repository.isAvailable(noteId))) {
      throw new Error('note unavailable');
    }

    const targetNote = (await this.repository.findAll({ id: noteId }))[0];
    const targetNoteBody = await this.repository.findBody(noteId);

    if (!targetNote || targetNoteBody === null) {
      throw new Error('invalid duplicate target');
    }

    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.repository.create(
      omit(targetNote, ['id', 'userCreatedAt', 'userUpdatedAt', 'createdAt', 'updatedAt']),
    );
    await this.updateBody(newNote.id, targetNoteBody);

    return newNote;
  }

  async update(noteId: NoteVO['id'], note: NoteDTO) {
    if (!(await this.repository.isAvailable(noteId))) {
      throw new Error('invalid id');
    }

    if (note.parentId && !(await this.repository.isAvailable(note.parentId))) {
      throw new Error('invalid parentId');
    }

    const result = await this.repository.update(noteId, note);

    if (!result) {
      throw new Error('invalid id');
    }

    return result;
  }

  async updateBody(noteId: NoteVO['id'], body: NoteBodyDTO) {
    if (!(await this.repository.isWritable(noteId))) {
      throw new Error('note unavailable');
    }

    return await this.repository.updateBody(noteId, body);
  }

  async getBody(noteId: NoteVO['id']) {
    if (!(await this.repository.isAvailable(noteId))) {
      throw new Error('note unavailable');
    }

    return await this.repository.findBody(noteId);
  }

  async query(q: NoteQuery) {
    return await this.repository.findAll(q);
  }
}
