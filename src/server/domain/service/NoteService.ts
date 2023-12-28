import { Inject, Injectable } from '@nestjs/common';
import assert from 'node:assert';
import { pick } from 'lodash-es';
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
import StarService from './StarService.js';
import EntityService from './EntityService.js';

@Injectable()
export default class NoteService extends BaseService {
  @Inject() private readonly starService!: StarService;
  @Inject() private readonly entityService!: EntityService;

  public async create(note: NewNoteDTO, from?: Note['id']) {
    let newNote: Required<Note>;

    if (from) {
      newNote = await this.duplicate(from);
    } else {
      if (note?.parentId) {
        await this.entityService.assertAvailableIds(EntityTypes.Note, [note.parentId]);
      }

      newNote = await this.repo.notes.create(note);
    }

    return await this.toVO(newNote);
  }

  private async duplicate(noteId: Note['id']) {
    await this.entityService.assertAvailableIds(EntityTypes.Note, [noteId]);

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

  private async toVO(notes: Note): Promise<NoteVO>;
  private async toVO(notes: Note[]): Promise<NoteVO[]>;
  private async toVO(notes: Note[] | Note) {
    const _notes = Array.isArray(notes) ? notes : [notes];
    const ids = _notes.map(({ id }) => id);
    const stars = await this.starService.getStarMap(ids);
    const children = await this.repo.notes.findChildrenIds(ids);
    const paths = await this.entityService.getPaths(EntityService.getLocators(_notes, EntityTypes.Note));

    const result = _notes.map((note) => ({
      ...pick(note, ['id', 'createdAt', 'icon', 'isReadonly', 'parentId', 'title']),
      updatedAt: note.userUpdatedAt,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
      path: paths[note.id] || [],
    }));

    return Array.isArray(notes) ? result : result[0]!;
  }

  public async batchUpdate(ids: Note['id'][], patch: NotePatch) {
    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    await this.repo.notes.update(ids, {
      ...patch,
      userUpdatedAt: Date.now(),
    });
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.entityService.assertAvailableIds(EntityTypes.Note, [parentId]);
    const descantIds = await this.repo.notes.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }
  }

  async query(q: ClientNoteQuery) {
    const notes = await this.repo.notes.findAll({ ...(typeof q === 'string' ? { id: [q] } : q), isAvailable: true });
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
    await this.entityService.assertAvailableIds(EntityTypes.Note, [noteId]);

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
