import { container, singleton } from 'tsyringe';
import assert from 'node:assert';
import { first, pick } from 'lodash-es';
import {
  type NoteVO,
  type NoteDTO,
  type NotePatchDTO,
  type Note,
  type ClientNoteQuery,
  normalizeTitle,
} from '@domain/model/note.js';
import { EntityTypes } from '@domain/model/entity.js';
import { EventNames } from '@domain/model/content.js';
import { buildIndex } from '@utils/collection.js';

import BaseService from './BaseService.js';
import VersionService from './VersionService.js';
import EntityService from './EntityService.js';

@singleton()
export default class NoteService extends BaseService {
  private readonly version = container.resolve(VersionService);
  private readonly entity = container.resolve(EntityService);

  public async create(note: NoteDTO, from?: Note['id']) {
    let newNote: Required<Note>;

    if (from) {
      newNote = await this.duplicate(from);
    } else {
      if (note.parentId) {
        await this.assertAvailableIds([note.parentId]);
      }

      newNote = await this.repo.notes.create(note);
    }

    if (newNote.body) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        content: newNote.body,
        entityId: newNote.id,
        entityType: EntityTypes.Note,
        updatedAt: newNote.updatedAt,
      });
    }
    return await this.toVO(newNote);
  }

  private async duplicate(noteId: Note['id']) {
    const targetNote = await this.repo.notes.findOneById(noteId);
    assert(targetNote);

    const newNote = await this.repo.notes.create({
      ...pick(targetNote, ['body', 'icon', 'parentId']),
      title: `${normalizeTitle(targetNote)}-副本`,
    });

    this.eventBus.emit(EventNames.ContentUpdated, {
      content: newNote.body,
      entityType: EntityTypes.Note,
      entityId: noteId,
      updatedAt: newNote.updatedAt,
    });

    return newNote;
  }

  public async updateOne(noteId: Note['id'], note: NotePatchDTO) {
    await this.assertAvailableIds([noteId]);

    const updatedAt = Date.now();
    await this.repo.notes.update(noteId, {
      ...note,
      updatedAt,
    });

    if (typeof note.body === 'string') {
      this.eventBus.emit(EventNames.ContentUpdated, {
        content: note.body,
        entityType: EntityTypes.Note,
        entityId: noteId,
        updatedAt,
      });
    }

    return this.queryOne(noteId);
  }

  private async toVO(notes: Note): Promise<Required<NoteVO>>;
  private async toVO(notes: Note[]): Promise<NoteVO[]>;
  private async toVO(notes: Note[] | Note): Promise<NoteVO | NoteVO[]> {
    const _notes = Array.isArray(notes) ? notes : [notes];
    const ids = _notes.map(({ id }) => id);
    const stars = buildIndex(await this.repo.stars.findAll({ entityId: ids }), 'entityId');
    const children = await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });
    const diff =
      Array.isArray(notes) || typeof notes.body !== 'string'
        ? undefined
        : await this.version.getDiff(notes.id, notes.body);

    const result: NoteVO[] = _notes.map((note) => ({
      ...note,
      childrenCount: children[note.id]?.length || 0,
      diff,
      isStar: Boolean(stars[note.id]),
    }));

    return Array.isArray(notes) ? result : first(result)!;
  }

  public async batchUpdate(ids: Note['id'][], patch: NotePatchDTO) {
    await this.assertAvailableIds(ids);
    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    const result = await this.repo.notes.update(ids, {
      ...patch,
      updatedAt: Date.now(),
    });

    assert(result);
  }

  private assertAvailableIds(ids: Note['id'][]) {
    return this.entity.assertAvailableIds(ids);
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descantIds = await this.repo.entities.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }
  }

  public async query(q: ClientNoteQuery) {
    const notes = await this.repo.notes.findAll({
      ...q,
      parentId: q.parentId || null,
      isAvailable: true,
    });
    const noteVOs = await this.toVO(notes);

    return noteVOs;
  }

  public async queryOne(id: Note['id']) {
    await this.assertAvailableIds([id]);
    const note = await this.repo.notes.findOneById(id);

    assert(note);
    return await this.toVO(note);
  }
}
