import { singleton } from 'tsyringe';
import assert from 'node:assert';
import { first, pick, uniq } from 'lodash-es';
import {
  type NoteVO,
  type NoteDTO,
  type NotePatchDTO,
  type Note,
  type ClientNoteQuery,
  normalizeTitle,
  NoteBatchPatchDTO,
} from '@domain/server/model/note.js';
import { EntityTypes } from '@domain/shared/model/entity.js';
import { EventNames } from '@domain/server/model/content.js';
import { arrayOf, buildIndex } from '@utils/collection.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class NoteService extends BaseService {
  @BaseService.transaction()
  public async create(note: NoteDTO, fromNoteId?: Note['id']) {
    let newNote: Required<Note>;

    if (fromNoteId) {
      newNote = await this.duplicate(fromNoteId);
    } else {
      if (note.parentId) {
        await this.assertAvailableIds([note.parentId]);
      }

      const now = Date.now();

      newNote = await this.repo.notes.create({
        title: note.title || '',
        parentId: note.parentId || null,
        body: note.body || '',
        icon: note.icon || null,
        id: EntityService.generateId(),
        updatedAt: now,
        createdAt: now,
      });
    }

    if (newNote.body || newNote.title) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        body: newNote.body,
        title: newNote.title,
        entityId: newNote.id,
        entityType: EntityTypes.Note,
        updatedAt: newNote.updatedAt,
      });
    }

    return await this.toVO(newNote, true);
  }

  private async duplicate(fromNoteId: Note['id']) {
    const targetNote = await this.repo.notes.findOneById(fromNoteId, { isAvailableOnly: true });
    assert(targetNote);

    const now = Date.now();
    const newNote = await this.repo.notes.create({
      ...pick(targetNote, ['body', 'icon', 'parentId']),
      title: `${normalizeTitle(targetNote)}-副本`,
      id: EntityService.generateId(),
      updatedAt: now,
      createdAt: now,
    });

    return newNote;
  }

  @BaseService.transaction()
  public async updateOne(noteId: Note['id'], notePatch: NotePatchDTO) {
    await this.assertAvailableIds([noteId]);

    if (notePatch.parentId) {
      await this.assertValidParent(notePatch.parentId, [noteId]);
    }

    const now = Date.now();
    const hasContentUpdated = typeof notePatch.title === 'string' || typeof notePatch.body === 'string';

    await this.repo.notes.update(noteId, {
      ...notePatch,
      updatedAt: hasContentUpdated ? now : undefined,
    });

    if (hasContentUpdated) {
      this.eventBus.emit(EventNames.ContentUpdated, {
        body: notePatch.body,
        title: notePatch.title,
        entityType: EntityTypes.Note,
        entityId: noteId,
        updatedAt: now,
      });
    }
  }

  private async toVO(notes: Note, isNew?: boolean): Promise<Required<NoteVO>>;
  private async toVO(notes: Note[]): Promise<NoteVO[]>;
  private async toVO(notes: Note[] | Note, isNew?: boolean): Promise<NoteVO | NoteVO[]> {
    const _notes = arrayOf(notes);
    const ids = _notes.map(({ id }) => id);
    const stars = isNew ? {} : buildIndex(await this.repo.stars.findAll({ entityIds: ids }), 'entityId');
    const children = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });

    const result: NoteVO[] = _notes.map((note) => ({
      ...note,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));

    return Array.isArray(notes) ? result : first(result)!;
  }

  @BaseService.transaction()
  public async batchUpdate(ids: Note['id'][], patch: NoteBatchPatchDTO) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    const result = await this.repo.notes.update(ids, patch);
    assert(result);
  }

  private async assertAvailableIds(ids: Note['id'][]) {
    ids = uniq(ids);
    const notes = await this.repo.notes.findAll({ id: ids, isAvailableOnly: true });

    assert(notes.length === ids.length, 'invalid note ids');
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descantIds = await this.repo.entities.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }
  }

  @BaseService.transaction()
  public async query(q: ClientNoteQuery) {
    const notes = await this.repo.notes.findAll({
      ...q,
      parentId: q.parentId || null,
      isAvailableOnly: true,
    });
    const noteVOs = await this.toVO(notes);

    return noteVOs;
  }

  @BaseService.transaction()
  public async queryOne(id: Note['id']) {
    const note = await this.repo.notes.findOneById(id, { isAvailableOnly: true });

    assert(note);
    return await this.toVO(note);
  }
}
