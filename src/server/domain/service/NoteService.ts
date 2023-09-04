import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import mapValues from 'lodash/mapValues';
import dayjs from 'dayjs';

import { buildIndex, getIds, getLocators } from 'utils/collection';
import {
  type NoteVO,
  type NoteBodyDTO,
  type NewNoteDTO,
  type Note,
  type NoteQuery,
  isDuplicate,
  isNewNote,
  normalizeTitle,
  NotePatch,
} from 'model/note';
import { EntityTypes } from 'model/entity';
import { Events } from 'model/events';

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
  async create(note: NewNoteDTO) {
    if (isNewNote(note) && note.parentId) {
      await this.assertAvailableIds([note.parentId]);
    }

    const newNote = isDuplicate(note) ? await this.duplicate(note.duplicateFrom) : await this.notes.create(note);

    return {
      ...omit(newNote, ['userUpdatedAt']),
      isStar: false,
      childrenCount: 0,
      title: normalizeTitle(newNote),
    };
  }

  private async duplicate(noteId: NoteVO['id']) {
    await this.assertAvailableIds([noteId]);

    const targetNote = await this.notes.findOneById(noteId);
    const targetNoteBody = await this.notes.findBody(noteId);

    if (!targetNote || targetNoteBody === null) {
      throw new Error('invalid duplicate target');
    }

    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.notes.create({
      body: targetNoteBody,
      ...omit(targetNote, ['id', 'createdAt', 'updatedAt']),
    });

    return newNote;
  }

  async updateBody(noteId: NoteVO['id'], content: NoteBodyDTO) {
    await this.db.transaction(async () => {
      if (!(await this.isWritable(noteId))) {
        throw new Error('note is readonly');
      }

      const result = await this.notes.update(noteId, {
        body: content,
        userUpdatedAt: dayjs().unix(),
      });

      if (result === null) {
        throw new Error('update note body failed');
      }

      return result;
    });

    this.eventEmitter.emit(Events.ContentUpdated, {
      id: noteId,
      type: EntityTypes.Note,
      content,
    });

    return content;
  }

  async queryBody(noteId: NoteVO['id']) {
    await this.assertAvailableIds([noteId]);

    const result = await this.notes.findBody(noteId);

    if (result === null) {
      throw new Error('note unavailable');
    }

    return result;
  }

  private async toVOs(rawNotes: Note[]) {
    const stars = buildIndex(await this.stars.findAllByLocators(getLocators(rawNotes, EntityTypes.Note)), 'entityId');
    const _children = await this.getChildrenIds(getIds(rawNotes));

    return rawNotes.map((note) => ({
      ...omit(note, ['userUpdatedAt']),
      title: normalizeTitle(note),
      childrenCount: _children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
      updatedAt: note.userUpdatedAt,
    }));
  }

  @Transaction
  async batchUpdate(ids: Note['id'][], patch: NotePatch) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    const result = await this.notes.update(ids, {
      ...patch,
      ...(typeof patch.title === 'undefined' ? null : { updatedAt: dayjs().unix() }),
    });

    return this.toVOs(result);
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descantIds = await this.notes.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      if (parentId === id || descantIds[id]?.includes(parentId)) {
        throw new Error('invalid new parent id');
      }
    }
  }

  async getTitles(ids: Note['id'][]) {
    const notes = await this.notes.findAll({ id: ids });
    return mapValues(buildIndex(notes), normalizeTitle);
  }

  private async queryAvailableNotes(q: NoteQuery) {
    const notes = await this.notes.findAll(q);
    const availableNotes = await this.recyclableService.filter(EntityTypes.Note, notes);

    return availableNotes;
  }

  async queryVO(q: NoteQuery): Promise<NoteVO[]>;
  async queryVO(id: NoteVO['id']): Promise<NoteVO>;
  async queryVO(q: NoteQuery | Note['id']) {
    const notes = await this.queryAvailableNotes(typeof q === 'string' ? { id: [q] } : q);
    const noteVOs = await this.toVOs(notes);
    const result = typeof q === 'string' ? noteVOs[0] : noteVOs;

    if (!result) {
      throw new Error('no note');
    }

    return result;
  }

  async getTreeFragment(noteId: NoteVO['id']) {
    await this.assertAvailableIds([noteId]);
    const ancestorIds = await this.notes.findAncestorIds(noteId);
    const childrenIds = Object.values(await this.notes.findChildrenIds(ancestorIds)).flat();

    const roots = await this.queryVO({ parentId: null });
    const children = await this.queryVO({ id: childrenIds });

    return EntityService.getTree(roots, children);
  }

  async assertAvailableIds(noteIds: NoteVO['id'][]) {
    const uniqueIds = uniq(noteIds);
    const rows = await this.queryAvailableNotes({ id: uniqueIds });

    if (rows.length !== uniqueIds.length) {
      throw new Error('invalid note id');
    }
  }

  private async isWritable(noteId: NoteVO['id']) {
    const row = (await this.queryAvailableNotes({ id: [noteId] }))[0];

    if (!row) {
      return false;
    }

    return !row.isReadonly;
  }
}
