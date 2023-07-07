import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';
import intersectionWith from 'lodash/intersectionWith';
import zipObject from 'lodash/zipObject';
import uniq from 'lodash/uniq';
import dayjs from 'dayjs';

import { buildIndex, getIds, getLocators } from 'utils/collection';
import {
  type NoteVO,
  type NoteBodyDTO,
  type NoteDTO,
  type NoteQuery,
  type NotesDTO,
  normalizeTitle,
} from 'interface/note';
import { EntityTypes } from 'interface/entity';
import { Events } from 'model/events';
import type { RawNoteVO } from 'model/note';

import BaseService, { Transaction } from './BaseService';
import RecyclableService from './RecyclableService';
import EntityService from './EntityService';

@Injectable()
export default class NoteService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;

  // not check the note ids' availability
  private async getChildren(noteIds: NoteVO['id'][]) {
    const children = await this.notes.findAllChildren(noteIds);

    return groupBy(await this.recyclableService.filterNotRecyclables(EntityTypes.Note, children), 'parentId');
  }

  @Transaction
  async create(note: NoteDTO) {
    if (note.parentId && !(await this.areAvailable([note.parentId]))) {
      throw new Error('invalid parentId');
    }

    if (note.duplicateFrom) {
      return { ...(await this.duplicate(note.duplicateFrom)), isStar: false, childrenCount: 0 };
    }

    return { ...(await this.notes.create(note)), isStar: false, childrenCount: 0 };
  }

  private async duplicate(noteId: NoteVO['id']) {
    if (!(await this.areAvailable([noteId]))) {
      throw new Error('note unavailable');
    }

    const targetNote = await this.notes.findOneById(noteId);
    const targetNoteBody = await this.notes.findBody(noteId);

    if (!targetNote || targetNoteBody === null) {
      throw new Error('invalid duplicate target');
    }

    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.notes.create(omit(targetNote, ['id', 'createdAt', 'updatedAt']));

    await this.notes.updateBody(newNote.id, targetNoteBody);
    return newNote;
  }

  async update(noteId: NoteVO['id'], note: NoteDTO) {
    const updated = (await this.batchUpdate([{ ...note, id: noteId }]))[0];

    if (!updated) {
      throw new Error('invalid update');
    }

    return updated;
  }

  async updateBody(noteId: NoteVO['id'], { content, isImportant }: NoteBodyDTO) {
    const result = await this.db.transaction(async () => {
      if (!(await this.isWritable(noteId))) {
        throw new Error('note is readonly');
      }

      const result = await this.notes.updateBody(noteId, content);

      if (result === null) {
        throw new Error('update note body failed');
      }

      await this.notes.update(noteId, { updatedAt: dayjs().unix() });

      return result;
    });

    this.eventEmitter.emit(Events.ContentUpdated, {
      id: noteId,
      type: EntityTypes.Note,
      content,
      isImportant,
    });

    return result;
  }

  async getBody(noteId: NoteVO['id']) {
    if (!(await this.areAvailable([noteId]))) {
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

    const stars = buildIndex(await this.stars.findAllByLocators(getLocators(notes, EntityTypes.Note)), 'entityId');
    const children = await this.getChildren(getIds(notes));

    return result.map((note) => ({
      ...note,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));
  }

  async query(q: NoteQuery | { id: NoteVO['id'] }) {
    const notes = await this.notes.findAll('id' in q ? { id: [q.id] } : q);
    const recyclables = await this.getNoteRecyclables(getIds(notes));
    const validNotes = notes.filter((note) => !recyclables[note.id]);

    const locators = getLocators(validNotes, EntityTypes.Note);
    const stars = buildIndex(await this.stars.findAllByLocators(locators), 'entityId');
    const children = await this.getChildren(getIds(validNotes));

    return validNotes.map((note) => ({
      ...note,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));
  }

  async queryOne(noteId: NoteVO['id']) {
    const note = (await this.query({ id: noteId }))[0];

    if (!note) {
      throw new Error('invalid note id');
    }

    return note;
  }

  async getTreeFragment(noteId: NoteVO['id']) {
    if (!(await this.areAvailable([noteId]))) {
      throw new Error('invalid id');
    }

    const notes = await this.notes.findTreeFragment(noteId);
    const availableNotes = await this.recyclableService.filterNotRecyclables(EntityTypes.Note, notes);
    const stars = buildIndex(
      await this.stars.findAllByLocators(getLocators(availableNotes, EntityTypes.Note)),
      'entityId',
    );
    const children = await this.getChildren(getIds(availableNotes));

    /* topo sort */
    const parents = groupBy(availableNotes, 'parentId');
    const result: RawNoteVO[] = availableNotes.filter(({ parentId }) => parentId === null);

    for (let i = 0; result[i]; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const children = parents[result[i]!.id];

      if (children) {
        result.push(...children);
      }
    }
    /* topo sort end */

    return result.map((note) => ({
      ...note,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));
  }

  private async assertValidChanges(notes: NotesDTO) {
    if (!(await this.areAvailable(getIds(notes)))) {
      throw new Error('invalid ids');
    }

    const parentChangedNotes = notes.filter(({ parentId }) => typeof parentId !== 'undefined');

    if (parentChangedNotes.length === 0) {
      return;
    }

    const newParentIds = parentChangedNotes.map(({ parentId }) => parentId).filter((id) => id) as NoteVO['id'][];

    if (!(await this.areAvailable(newParentIds))) {
      throw new Error('invalid ids');
    }

    const ids = getIds(parentChangedNotes);
    const allDescendants = await this.notes.findAllDescendants(ids);
    const descendantGroup = EntityService.groupDescants(ids, allDescendants);

    for (const { parentId, id } of parentChangedNotes) {
      if (!parentId) {
        continue;
      }

      if (descendantGroup[id]?.find((descants) => descants.id === parentId)) {
        throw new Error(`can not move ${id} to ${parentId}`);
      }
    }
  }

  async areAvailable(noteIds: NoteVO['id'][]) {
    const uniqueIds = uniq(noteIds);
    const rows = await this.notes.findAll({ id: uniqueIds });

    if (rows.length !== uniqueIds.length) {
      return false;
    }

    return !(await this.areNoteRecyclables(uniqueIds));
  }

  private async isWritable(noteId: NoteVO['id']) {
    const row = await this.notes.findOneById(noteId);

    if (!row) {
      return false;
    }

    if (await this.areNoteRecyclables([noteId])) {
      return false;
    }

    return !row.isReadonly;
  }

  private async areNoteRecyclables(noteIds: NoteVO['id'][]) {
    const recyclables = await this.getNoteRecyclables(noteIds);
    return Object.values(recyclables).some((v) => v);
  }

  private async getNoteRecyclables(noteIds: NoteVO['id'][]) {
    const ancestors = await this.notes.findAllAncestors(noteIds);
    const ancestorsMap = EntityService.getAncestorsMap(noteIds, ancestors);
    const recyclables = await this.recyclables.findAllByLocators(getLocators(ancestors, EntityTypes.Note));

    return zipObject(
      noteIds,
      noteIds.map(
        (id) => intersectionWith(ancestorsMap[id], recyclables, ({ id }, { entityId }) => entityId === id).length > 0,
      ),
    );
  }
}
