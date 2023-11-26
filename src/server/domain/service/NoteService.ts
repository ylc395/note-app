import { Inject, Injectable } from '@nestjs/common';
import assert from 'node:assert';
import pick from 'lodash/pick';
import {
  type NoteVO,
  type NewNoteDTO,
  type NotePatchDTO,
  type Note,
  type ClientNoteQuery,
  type NotePatch,
  normalizeTitle,
} from 'model/note';
import { EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import StarService from './StarService';
import EntityService from './EntityService';

@Injectable()
export default class NoteService extends BaseService {
  @Inject() private readonly starService!: StarService;
  @Inject() private readonly entityService!: EntityService;

  private static getMetadata(note: Note) {
    return {
      ...pick(note, ['id', 'createdAt', 'icon', 'isReadonly', 'parentId']),
      title: normalizeTitle(note),
      updatedAt: note.userUpdatedAt,
    };
  }

  async create(note: NewNoteDTO, from?: Note['id']) {
    let newNote: Required<Note>;

    if (from) {
      newNote = await this.duplicate(from);
    } else {
      if (note?.parentId) {
        await this.entityService.assertAvailableIds(EntityTypes.Note, [note.parentId]);
      }

      newNote = await this.repo.notes.create(note);
    }

    return {
      ...NoteService.getMetadata(newNote),
      isStar: false,
      childrenCount: 0,
    };
  }

  private async duplicate(noteId: NoteVO['id']) {
    await this.entityService.assertAvailableIds(EntityTypes.Note, [noteId]);

    const targetNote = await this.repo.notes.findOneById(noteId);
    assert(targetNote);
    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.repo.notes.create(pick(targetNote, ['title', 'body', 'icon', 'parentId']));

    this.eventBus.emit('contentUpdated', {
      content: targetNote.body,
      entityId: newNote.id,
      entityType: EntityTypes.Note,
      updatedAt: targetNote.updatedAt,
    });

    return newNote;
  }

  private async noteToDetail(note: Required<Note>) {
    const path = (await this.entityService.getPaths(EntityService.getLocators([note], EntityTypes.Note)))[note.id];

    assert(path);

    return { ...NoteService.getMetadata(note), body: note.body, path };
  }

  async updateOne(noteId: NoteVO['id'], note: NotePatchDTO) {
    await this.transaction(async () => {
      const userUpdatedAt = Date.now();

      if (typeof note.body === 'string') {
        assert(await this.isWritable(noteId));
      }

      const result = await this.repo.notes.update(noteId, {
        ...note,
        userUpdatedAt,
      });

      assert(result);

      if (typeof note.body === 'string') {
        this.eventBus.emit('contentUpdated', {
          content: note.body,
          entityId: noteId,
          entityType: EntityTypes.Note,
          updatedAt: userUpdatedAt,
        });
      }
    });
  }

  private async toVO(notes: Note[]) {
    const ids = notes.map(({ id }) => id);
    const stars = await this.starService.getStarMap(ids);
    const _children = await this.repo.notes.findChildrenIds(ids);

    return notes.map((note) => ({
      ...pick(note, ['id', 'createdAt', 'icon', 'isReadonly', 'parentId']),
      title: normalizeTitle(note),
      childrenCount: _children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
      updatedAt: note.userUpdatedAt,
    }));
  }

  async batchUpdate(ids: Note['id'][], patch: NotePatch) {
    await this.entityService.assertAvailableIds(EntityTypes.Note, ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    await this.repo.notes.update(ids, {
      ...patch,
      ...(typeof patch.title === 'undefined' ? null : { userUpdatedAt: Date.now() }),
    });
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.entityService.assertAvailableIds(EntityTypes.Note, [parentId]);
    const descantIds = await this.repo.notes.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }
  }

  async queryNotes(q: ClientNoteQuery) {
    const notes = await this.repo.notes.findAll({ ...(typeof q === 'string' ? { id: [q] } : q), isAvailable: true });
    const noteVOs = await this.toVO(notes);

    return noteVOs;
  }

  async queryOneNote(id: Note['id']) {
    const note = await this.repo.notes.findOneById(id);

    assert(note);

    return this.noteToDetail(note);
  }

  async getTreeFragment(noteId: NoteVO['id']) {
    await this.entityService.assertAvailableIds(EntityTypes.Note, [noteId]);

    const ancestorIds = (await this.repo.notes.findAncestorIds([noteId]))[noteId] || [];
    const childrenIds = Object.values(await this.repo.notes.findChildrenIds(ancestorIds, true)).flat();

    const roots = await this.repo.notes.findAll({ parentId: null, isAvailable: true });
    const children = await this.repo.notes.findAll({ id: childrenIds });

    return this.toVO([...roots, ...children]);
  }

  private async isWritable(noteId: NoteVO['id']) {
    const row = await this.repo.notes.findOneById(noteId, true);

    if (!row || row.isReadonly) {
      return false;
    }

    return true;
  }
}
