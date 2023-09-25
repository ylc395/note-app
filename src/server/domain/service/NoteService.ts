import { Inject, Injectable, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';

import { buildIndex, getLocators } from 'utils/collection';
import {
  type NoteVO,
  type NoteBodyDTO,
  type NewNoteDTO,
  type Note,
  type ClientNoteQuery,
  isDuplicate,
  isNewNote,
  normalizeTitle,
  NotePatch,
} from 'model/note';
import { EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import ContentService from './ContentService';
import StarService from './StarService';

@Injectable()
export default class NoteService extends BaseService {
  @Inject(forwardRef(() => ContentService)) private readonly contentService!: ContentService;
  @Inject(forwardRef(() => StarService)) private readonly starService!: StarService;

  async create(note: NewNoteDTO) {
    if (isNewNote(note) && note.parentId) {
      await this.assertAvailableIds([note.parentId]);
    }

    const newNote = isDuplicate(note) ? await this.duplicate(note.duplicateFrom) : await this.repo.notes.create(note);

    return {
      ...omit(newNote, ['userUpdatedAt']),
      isStar: false,
      childrenCount: 0,
      title: normalizeTitle(newNote),
    };
  }

  private async duplicate(noteId: NoteVO['id']) {
    await this.assertAvailableIds([noteId]);

    const targetNote = await this.repo.notes.findOneById(noteId);
    const targetNoteBody = await this.repo.notes.findBody(noteId);

    if (!targetNote || targetNoteBody === null) {
      throw new Error('invalid duplicate target');
    }

    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.repo.notes.create({
      body: targetNoteBody,
      ...omit(targetNote, ['id', 'createdAt', 'updatedAt']),
    });

    this.contentService.processContent({ content: targetNoteBody, entityId: newNote.id, entityType: EntityTypes.Note });

    return newNote;
  }

  async updateBody(noteId: NoteVO['id'], content: NoteBodyDTO) {
    await this.transaction(async () => {
      if (!(await this.isWritable(noteId))) {
        throw new Error('note is readonly');
      }

      const result = await this.repo.notes.update(noteId, {
        body: content,
        userUpdatedAt: Date.now(),
      });

      if (result === null) {
        throw new Error('update note body failed');
      }

      return result;
    });

    this.contentService.processContent({ content, entityId: noteId, entityType: EntityTypes.Note });

    return content;
  }

  async queryBody(noteId: NoteVO['id']) {
    await this.assertAvailableIds([noteId]);

    const result = await this.repo.notes.findBody(noteId);

    if (result === null) {
      throw new Error('note unavailable');
    }

    return result;
  }

  private async toVOs(rawNotes: Note[]) {
    const stars = await this.starService.getStarMap(getLocators(rawNotes, EntityTypes.Note));
    const _children = await this.repo.notes.findChildrenIds(map(rawNotes, 'id'), { isAvailable: true });

    return rawNotes.map((note) => ({
      ...omit(note, ['userUpdatedAt']),
      title: normalizeTitle(note),
      childrenCount: _children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
      updatedAt: note.userUpdatedAt,
    }));
  }

  async batchUpdate(ids: Note['id'][], patch: NotePatch) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    const result = await this.repo.notes.update(ids, {
      ...patch,
      ...(typeof patch.title === 'undefined' ? null : { userUpdatedAt: Date.now() }),
    });

    return this.toVOs(result);
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descantIds = await this.repo.notes.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      if (parentId === id || descantIds[id]?.includes(parentId)) {
        throw new Error('invalid new parent id');
      }
    }
  }

  async getTitles(ids: Note['id'][]) {
    const notes = await this.repo.notes.findAll({ id: ids });
    return mapValues(buildIndex(notes), normalizeTitle);
  }

  async queryVO(q: ClientNoteQuery): Promise<NoteVO[]>;
  async queryVO(id: NoteVO['id']): Promise<NoteVO>;
  async queryVO(q: ClientNoteQuery | Note['id']) {
    const notes = await this.repo.notes.findAll({ ...(typeof q === 'string' ? { id: [q] } : q), isAvailable: true });
    const noteVOs = await this.toVOs(notes);
    const result = typeof q === 'string' ? noteVOs[0] : noteVOs;

    if (!result) {
      throw new Error('no note');
    }

    return result;
  }

  async getTreeFragment(noteId: NoteVO['id']) {
    await this.assertAvailableIds([noteId]);

    const ancestorIds = (await this.repo.notes.findAncestorIds([noteId]))[noteId] || [];
    const childrenIds = Object.values(await this.repo.notes.findChildrenIds(ancestorIds, { isAvailable: true })).flat();

    const roots = await this.repo.notes.findAll({ parentId: null, isAvailable: true });
    const children = await this.repo.notes.findAll({ id: childrenIds });

    return this.toVOs([...roots, ...children]);
  }

  async assertAvailableIds(noteIds: NoteVO['id'][]) {
    const uniqueIds = uniq(noteIds);
    const rows = await this.repo.notes.findAll({ id: uniqueIds, isAvailable: true });

    if (rows.length !== uniqueIds.length) {
      throw new Error('invalid note id');
    }
  }

  private async isWritable(noteId: NoteVO['id']) {
    const row = (await this.repo.notes.findAll({ id: [noteId], isAvailable: true }))[0];

    if (!row) {
      return false;
    }

    return !row.isReadonly;
  }
}
