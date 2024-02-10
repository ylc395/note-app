import { singleton } from 'tsyringe';
import assert from 'node:assert';
import { mapValues, pick, uniq } from 'lodash-es';
import {
  type NoteVO,
  type NewNoteDTO,
  type NotePatchDTO,
  type Note,
  type ClientNoteQuery,
  type NotePatch,
  normalizeTitle,
} from '@domain/model/note.js';
import { EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import { getPaths, getTreeFragment } from './behaviors.js';
import { buildIndex } from '@utils/collection.js';

@singleton()
export default class NoteService extends BaseService {
  public async create(note: NewNoteDTO, from?: Note['id']) {
    let newNote: Required<Note>;

    if (from) {
      newNote = await this.duplicate(from);
    } else {
      if (note.parentId) {
        await this.assertAvailableIds([note.parentId]);
      }

      newNote = await this.repo.notes.create(note);
    }

    return await this.toVO(newNote);
  }

  private async duplicate(noteId: Note['id']) {
    const targetNote = await this.repo.notes.findOneById(noteId, true);
    assert(targetNote);

    const newNote = await this.repo.notes.create({
      ...pick(targetNote, ['body', 'icon', 'parentId']),
      title: `${normalizeTitle(targetNote)}-副本`,
    });

    this.eventBus.emit('contentUpdated', {
      content: targetNote.body,
      entityId: newNote.id,
      entityType: EntityTypes.Note,
      updatedAt: targetNote.updatedAt,
    });

    return newNote;
  }

  public async updateBody(noteId: Note['id'], body: string) {
    const updatedAt = Date.now();

    await this.assertWritable(noteId);
    const result = await this.repo.notes.update(noteId, { body, updatedAt });
    assert(result);

    this.eventBus.emit('contentUpdated', {
      content: body,
      entityId: noteId,
      updatedAt,
      entityType: EntityTypes.Note,
    });
  }

  public readonly getNormalizedTitles = async (ids: Note['id'][]) => {
    const entities = buildIndex(await this.repo.notes.findAll({ id: ids }));
    return mapValues(entities, normalizeTitle);
  };

  public readonly getPaths = async (ids: Note['id'][]) => {
    return getPaths({ ids, repo: this.repo.notes, normalizeTitle });
  };

  public async updateOne(noteId: Note['id'], note: NotePatchDTO) {
    return this.transaction(async () => {
      const result = await this.repo.notes.update(noteId, {
        ...note,
        updatedAt: Date.now(),
      });

      assert(result);

      return this.queryOne(noteId);
    });
  }

  private async toVO(notes: Note): Promise<Required<NoteVO>>;
  private async toVO(notes: Note[]): Promise<NoteVO[]>;
  private async toVO(notes: Note[] | Note): Promise<NoteVO | NoteVO[]> {
    const _notes = Array.isArray(notes) ? notes : [notes];
    const ids = _notes.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAllByEntityId(ids));
    const children = await this.repo.notes.findChildrenIds(ids, true);
    const paths = Array.isArray(notes) ? {} : await this.getPaths(ids);

    const result = _notes.map((note) => ({
      ...pick(note, ['id', 'createdAt', 'updatedAt', 'icon', 'isReadonly', 'parentId', 'title']),
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
      ...(Array.isArray(notes) ? null : { path: paths[note.id] || [] }),
    }));

    return Array.isArray(notes) ? result : result[0]!;
  }

  public async batchUpdate(ids: Note['id'][], patch: NotePatch) {
    return this.transaction(async () => {
      if (patch.parentId) {
        await this.assertValidParent(patch.parentId, ids);
      }

      const result = await this.repo.notes.update(ids, {
        ...patch,
        updatedAt: Date.now(),
      });

      assert(result);

      return this.query({ id: ids });
    });
  }

  public readonly assertAvailableIds = async (ids: Note['id'][]) => {
    const notes = await this.repo.notes.findAll({ id: ids, isAvailable: true });
    assert(notes.length === uniq(ids).length);
  };

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descantIds = await this.repo.notes.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }
  }

  public async query(q: ClientNoteQuery & { id?: Note['id'][] }) {
    const notes = await this.repo.notes.findAll({
      ...q,
      parentId: q.parentId === null ? null : q.parentId,
      isAvailable: true,
    });
    const noteVOs = await this.toVO(notes);

    return noteVOs;
  }

  public async queryOne(id: Note['id']) {
    const note = await this.repo.notes.findOneById(id, true);
    assert(note);

    return await this.toVO(note);
  }

  public async queryBody(id: Note['id']) {
    const note = await this.repo.notes.findOneById(id, true);
    assert(note);

    return note.body;
  }

  public async getTreeFragment(noteId: Note['id']) {
    await this.assertAvailableIds([noteId]);
    const nodes = await getTreeFragment(this.repo.notes, noteId);

    return await this.toVO(nodes as Note[]);
  }

  private async assertWritable(noteId: Note['id']) {
    const row = await this.repo.notes.findOneById(noteId, true);

    assert(row && !row.isReadonly, 'not writable');
  }
}
