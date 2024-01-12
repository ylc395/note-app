import { singleton } from 'tsyringe';
import assert from 'node:assert';
import { pick, uniq } from 'lodash-es';
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
import { getNormalizedTitles, getPaths } from './composables.js';
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
    await this.assertAvailableIds([noteId]);

    const targetNote = await this.repo.notes.findOneById(noteId);
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
    const userUpdatedAt = Date.now();

    assert(await this.isWritable(noteId));
    await this.repo.notes.update(noteId, { body, userUpdatedAt });

    this.eventBus.emit('contentUpdated', {
      content: body,
      entityId: noteId,
      entityType: EntityTypes.Note,
      updatedAt: userUpdatedAt,
    });
  }

  public getNormalizedTitles = async (ids: Note['id'][]) => {
    return getNormalizedTitles({ repo: this.repo.notes, ids, normalizeTitle });
  };

  public readonly getPaths = async (ids: Note['id'][]) => {
    return getPaths({ ids, repo: this.repo.notes, normalizeTitle });
  };

  public async updateOne(noteId: Note['id'], note: NotePatchDTO) {
    await this.transaction(async () => {
      const userUpdatedAt = Date.now();

      const result = await this.repo.notes.update(noteId, {
        ...note,
        userUpdatedAt,
      });

      assert(result);
    });
  }

  private async toVO(notes: Note): Promise<Required<NoteVO>>;
  private async toVO(notes: Note[]): Promise<NoteVO[]>;
  private async toVO(notes: Note[] | Note): Promise<NoteVO | NoteVO[]> {
    const _notes = Array.isArray(notes) ? notes : [notes];
    const ids = _notes.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAllByEntityId(ids));
    const children = await this.repo.notes.findChildrenIds(ids);
    const paths = Array.isArray(notes) ? {} : await this.getPaths(ids);

    const result = _notes.map((note) => ({
      ...pick(note, ['id', 'createdAt', 'icon', 'isReadonly', 'parentId', 'title']),
      updatedAt: note.userUpdatedAt,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
      ...(Array.isArray(notes) ? { path: paths[note.id] || [] } : null),
    }));

    return Array.isArray(notes) ? result : result[0]!;
  }

  public async batchUpdate(ids: Note['id'][], patch: NotePatch) {
    await this.transaction(async () => {
      if (patch.parentId) {
        await this.assertValidParent(patch.parentId, ids);
      }

      const result = await this.repo.notes.update(ids, {
        ...patch,
        userUpdatedAt: Date.now(),
      });

      assert(result);
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

  async query(q: ClientNoteQuery) {
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

    const ancestorIds = (await this.repo.notes.findAncestorIds([noteId]))[noteId] || [];
    const childrenIds = Object.values(await this.repo.notes.findChildrenIds(ancestorIds, true)).flat();

    const roots = await this.repo.notes.findAll({ parentId: null, isAvailable: true });
    const children = await this.repo.notes.findAll({ id: childrenIds });

    return this.toVO([...roots, ...children]);
  }

  private async isWritable(noteId: Note['id']) {
    const row = await this.repo.notes.findOneById(noteId, true);

    if (!row || row.isReadonly) {
      return false;
    }

    return true;
  }
}
