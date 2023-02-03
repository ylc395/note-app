import { Injectable, Inject } from '@nestjs/common';
import omit from 'lodash/omit';

import { NoteVO, NoteBodyDTO, NoteDTO, NoteQuery, normalizeTitle } from 'interface/Note';
import { token as noteRepositoryToken, type NoteRepository } from 'service/repository/NoteRepository';

@Injectable()
export default class NoteService {
  constructor(@Inject(noteRepositoryToken) private readonly repository: NoteRepository) {}

  async create(note: NoteDTO) {
    if (note.duplicateFrom) {
      return this.duplicate(note.duplicateFrom);
    }

    return await this.repository.create(note);
  }

  private async duplicate(id: NoteVO['id']) {
    const targetNote = (await this.repository.findAll({ id }))[0];
    const targetNoteBody = await this.repository.findBody(id);

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
    return await this.repository.update(noteId, note);
  }

  async updateBody(noteId: NoteVO['id'], body: NoteBodyDTO) {
    return await this.repository.updateBody(noteId, body);
  }

  async getBody(noteId: NoteVO['id']) {
    return await this.repository.findBody(noteId);
  }

  async query(q: NoteQuery) {
    return await this.repository.findAll(q);
  }
}
