import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';
import intersection from 'lodash/intersection';
import intersectionWith from 'lodash/intersectionWith';
import zipObject from 'lodash/zipObject';
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

import BaseService from './BaseService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';
import EntityService from './EntityService';

@Injectable()
export default class NoteService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;
  @Inject(forwardRef(() => StarService)) private readonly starService!: StarService;

  // not check the note ids' availability
  private async getChildren(noteIds: NoteVO['id'][]) {
    const children = await this.notes.findAllChildren(noteIds);

    return groupBy(await this.recyclableService.filterNotRecyclables(EntityTypes.Note, children), 'parentId');
  }

  async create(note: NoteDTO) {
    return await this.db.transaction(async () => {
      if (note.parentId && !(await this.areAvailable([note.parentId]))) {
        throw new Error('invalid parentId');
      }

      if (note.duplicateFrom) {
        return { ...(await this.duplicate(note.duplicateFrom)), isStar: false, childrenCount: 0 };
      }

      return { ...(await this.notes.create(note)), isStar: false, childrenCount: 0 };
    });
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

    await this.notes.updateBody(noteId, targetNoteBody);
    return newNote;
  }

  async update(noteId: NoteVO['id'], note: NoteDTO) {
    await this.assertValidChanges([{ ...note, id: noteId }]);

    const result = await this.notes.update(noteId, { ...note, updatedAt: dayjs().unix() });

    if (!result) {
      throw new Error('invalid id');
    }

    const isStar = await this.starService.isStar({ type: EntityTypes.Note, id: noteId });
    const children = await this.getChildren([noteId]);

    return { ...result, isStar, childrenCount: children[noteId]?.length || 0 };
  }

  async updateBody(noteId: NoteVO['id'], { content, isImportant }: NoteBodyDTO) {
    const result = await this.db.transaction(async () => {
      if (!(await this.isWritable(noteId))) {
        throw new Error('note unavailable');
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

  async query(q: NoteQuery) {
    const notes = await this.notes.findAll(q);
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
    const note = await this.notes.findOneById(noteId);

    if (!note) {
      throw new Error('not found');
    }

    if (await this.areNoteRecyclables([noteId])) {
      throw new Error('not found');
    }

    const children = await this.getChildren([noteId]);

    return {
      ...note,
      childrenCount: children[noteId]?.length || 0,
      isStar: await this.starService.isStar({ type: EntityTypes.Note, id: noteId }),
    };
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

    const parentChangedNotes = notes.filter((parent) => typeof parent !== undefined);

    if (parentChangedNotes.length === 0) {
      return;
    }

    const descendants = await this.notes.findAllDescendants(getIds(parentChangedNotes));
    const invalidParentIds = intersection(
      getIds(descendants),
      parentChangedNotes.map(({ parentId }) => parentId).filter((id) => id),
    );

    if (invalidParentIds.length > 0) {
      throw new Error(`invalid parent id: ${invalidParentIds.join()}`);
    }
  }

  async areAvailable(noteIds: NoteVO['id'][]) {
    const rows = await this.notes.findAll({ id: noteIds });

    if (rows.length !== noteIds.length) {
      return false;
    }

    return !(await this.areNoteRecyclables(noteIds));
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
