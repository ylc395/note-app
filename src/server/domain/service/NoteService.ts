import { Injectable } from '@nestjs/common';
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
  normalizeTitle,
} from 'interface/Note';
import BaseService from './BaseService';

@Injectable()
export default class NoteService extends BaseService {
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

  async query(q: NoteQuery) {
    return await this.notes.findAll(q);
  }

  @Transaction
  async getTreeFragment(noteId: NoteVO['id']) {
    if (!(await this.notes.areAvailable([noteId]))) {
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

  async getTreePath(noteId: NoteVO['id']) {
    if (!(await this.notes.areAvailable([noteId]))) {
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

    if (!(await this.notes.areAvailable(ids))) {
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
    const invalidParentIds = intersection(descendantIds, parentChangedNoteIds);

    if (invalidParentIds.length > 0) {
      throw new Error(`invalid parent id: ${invalidParentIds.join()}`);
    }
  }
}
