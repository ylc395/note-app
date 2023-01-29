import { Injectable, Inject } from '@nestjs/common';

import type { NoteVO, NoteBodyDTO, NoteDTO, NoteQuery } from 'interface/Note';
import { token as noteRepositoryToken, type NoteRepository } from 'service/repository/NoteRepository';

@Injectable()
export default class NoteService {
  constructor(@Inject(noteRepositoryToken) private readonly repository: NoteRepository) {}

  async create(note: NoteDTO) {
    return await this.repository.create(note);
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
