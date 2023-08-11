import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';
import dayjs from 'dayjs';

import { buildIndex, getIds, getLocators } from 'utils/collection';
import {
  type NoteVO,
  type NoteBodyDTO,
  type NoteDTO,
  type ClientNoteQuery,
  type NotesDTO,
  normalizeTitle,
} from 'model/note';
import { EntityTypes, type HierarchyEntity } from 'model/entity';
import { Events } from 'model/events';
import type { Note, NoteQuery } from 'model/note';

import BaseService, { Transaction } from './BaseService';
import RecyclableService from './RecyclableService';
import EntityService from './EntityService';

@Injectable()
export default class NoteService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  private async getChildrenIds(noteIds: NoteVO['id'][]) {
    const children = await this.notes.findChildrenIds(noteIds);
    const availableChildren = await this.recyclableService.filterByLocators(children, (id) => ({
      id,
      type: EntityTypes.Note,
    }));

    return availableChildren;
  }

  @Transaction
  async create(note: NoteDTO) {
    if (note.parentId && !(await this.areAvailable([note.parentId]))) {
      throw new Error('invalid parentId');
    }

    const newNote = note.duplicateFrom ? await this.duplicate(note.duplicateFrom) : await this.notes.create(note);
    return this.query(newNote.id);
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

  async queryBody(noteId: NoteVO['id']) {
    if (!(await this.areAvailable([noteId]))) {
      throw new Error('note unavailable');
    }

    const result = await this.notes.findBody(noteId);

    if (result === null) {
      throw new Error('note unavailable');
    }

    return result;
  }

  private async addInfo(rawNotes: Note[], children?: Record<NoteVO['id'], NoteVO['id'][]>) {
    const stars = buildIndex(await this.stars.findAllByLocators(getLocators(rawNotes, EntityTypes.Note)), 'entityId');
    const _children = children || (await this.getChildrenIds(getIds(rawNotes)));

    return rawNotes.map((note) => ({
      ...note,
      title: normalizeTitle(note),
      childrenCount: _children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));
  }

  @Transaction
  async batchUpdate(notes: NotesDTO) {
    await this.assertValidChanges(notes);
    const result = await this.notes.batchUpdate(notes);

    if (result.length !== notes.length) {
      throw new Error('invalid notes');
    }

    return this.addInfo(result);
  }

  async query(q: ClientNoteQuery): Promise<NoteVO[]>;
  async query(id: NoteVO['id']): Promise<NoteVO>;
  async query(q: ClientNoteQuery | NoteVO['id']): Promise<NoteVO[] | NoteVO> {
    const notes = await this.getAll(typeof q === 'string' ? q : { parentId: null, ...q });
    const availableNotes = await this.recyclableService.filter(EntityTypes.Note, notes);

    const result = typeof q === 'string' ? availableNotes[0] : availableNotes;

    if (!result) {
      throw new Error('no note');
    }

    return result;
  }

  private async getAll(q: NoteQuery | Note['id']) {
    const rawNotes = await this.notes.findAll(typeof q === 'string' ? { id: [q] } : q);
    return this.addInfo(rawNotes);
  }

  async getTreeFragment(noteId: NoteVO['id']) {
    if (!(await this.areAvailable([noteId]))) {
      throw new Error('invalid id');
    }

    const ancestorIds = await this.notes.findAncestorIds(noteId);
    const childrenIds = await this.getChildrenIds(ancestorIds);

    const roots = await this.query({ parentId: null });
    const children = groupBy(await this.getAll({ id: Object.values(childrenIds).flat() }), 'parentId');

    /* topo sort */
    const result: NoteVO[] = [...roots];

    for (let i = 0; result[i]; i++) {
      const { id } = result[i]!;
      result.push(...(children[id] || []));
    }
    /* topo sort end */

    return result;
  }

  private async assertValidChanges(notes: NotesDTO) {
    if (!(await this.areAvailable(getIds(notes)))) {
      throw new Error('invalid ids');
    }

    const parentChangedNotes = notes.filter(({ parentId }) => typeof parentId !== 'undefined');

    if (parentChangedNotes.length === 0) {
      return;
    }

    await this.entityService.assertValidParents(EntityTypes.Note, parentChangedNotes as HierarchyEntity[]);
  }

  async areAvailable(noteIds: NoteVO['id'][]) {
    const uniqueIds = uniq(noteIds);
    const rows = await this.notes.findAll({ id: uniqueIds });

    if (rows.length !== uniqueIds.length) {
      return false;
    }

    return (await this.recyclableService.filter(EntityTypes.Note, rows)).length === uniqueIds.length;
  }

  private async isWritable(noteId: NoteVO['id']) {
    try {
      const row = await this.query(noteId);
      return !row.isReadonly;
    } catch (error) {
      return false;
    }
  }
}
