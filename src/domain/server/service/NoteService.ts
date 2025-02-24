import assert from 'node:assert';
import { first, pick, uniq } from 'lodash-es';
import {
  type NoteVO,
  type NoteDTO,
  type NotePatchDTO,
  type Note,
  type ClientNoteQuery,
  type NoteBatchPatchDTO,
  normalizeTitle,
  NoteTypes,
} from '#domain/shared/model/note.js';
import { arrayOf, buildIndex } from '#utils/collection.js';
import { container } from '#domain/shared/infra/singletons.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';

export default class NoteService extends BaseService {
  private readonly content = container.resolve(ContentService);

  @BaseService.transaction
  public async create(note: NoteDTO) {
    let newNote: Required<Note>;

    if ('from' in note) {
      newNote = await this.duplicate(note.from);
    } else {
      if (note.fileId || note.sourceUrl) {
        assert(note.type === NoteTypes.Material, 'invalid type');
      }

      if (note.parentId) {
        await this.assertAvailableIds([note.parentId], { type: note.type });
      }

      const now = Date.now();

      newNote = await this.repo.notes.create({
        id: EntityService.generateId(),
        type: note.type,
        title: note.title || '',
        parentId: note.parentId || null,
        body: note.body || '',
        bodyPlainText: note.body ? ContentService.markdownToPlain(note.body) : '',
        icon: note.icon || null,
        fileId: note.fileId || null,
        sourceUrl: note.sourceUrl || null,
        updatedAt: now,
        createdAt: now,
      });
    }

    if (newNote.body) {
      this.content.extract(newNote);
    }

    return await this.toVO(newNote, true);
  }

  private async duplicate(fromNoteId: Note['id']) {
    const targetNote = await this.repo.notes.findOneById(fromNoteId, { isAvailableOnly: true });
    assert(targetNote && targetNote.type === NoteTypes.Note);

    const now = Date.now();

    return await this.repo.notes.create({
      ...pick(targetNote, ['body', 'bodyPlainText', 'icon', 'parentId', 'sourceUrl', 'fileId', 'type']),
      title: `${normalizeTitle(targetNote)}-副本`,
      id: EntityService.generateId(),
      updatedAt: now,
      createdAt: now,
    });
  }

  @BaseService.transaction
  public async updateOne(noteId: Note['id'], notePatch: NotePatchDTO) {
    await this.assertAvailableIds([noteId]);

    if (notePatch.parentId) {
      await this.assertValidParent(notePatch.parentId, [noteId]);
    }

    const hasContentUpdated = typeof notePatch.title === 'string' || typeof notePatch.body === 'string';

    await this.repo.notes.update(noteId, {
      ...notePatch,
      bodyPlainText: typeof notePatch.body === 'string' ? ContentService.markdownToPlain(notePatch.body) : undefined,
      updatedAt: hasContentUpdated ? Date.now() : undefined,
    });

    if (typeof notePatch.body === 'string') {
      await this.content.extract({ id: noteId, body: notePatch.body });
    }
  }

  private async toVO(notes: Note, isNew?: boolean): Promise<Required<NoteVO>>;
  private async toVO(notes: Note[]): Promise<NoteVO[]>;
  private async toVO(notes: Note[] | Note, isNew?: boolean): Promise<NoteVO | NoteVO[]> {
    const _notes = arrayOf(notes);
    const ids = _notes.map(({ id }) => id);
    const stars = isNew ? {} : buildIndex(await this.repo.stars.findAll({ entityIds: ids }), 'entityId');
    const children = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });

    const result: NoteVO[] = _notes.map(({ bodyPlainText: _, ...note }) => ({
      ...note,
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));

    return Array.isArray(notes) ? result : first(result)!;
  }

  @BaseService.transaction
  public async batchUpdate(ids: Note['id'][], patch: NoteBatchPatchDTO) {
    await this.assertAvailableIds(ids);

    if (patch.parentId) {
      await this.assertValidParent(patch.parentId, ids);
    }

    const result = await this.repo.notes.update(ids, patch);
    assert(result);
  }

  public async assertAvailableIds(ids: Note['id'][], params?: { withFile?: boolean; type?: NoteTypes }) {
    ids = uniq(ids);
    const notes = await this.repo.notes.findAll({ id: ids, isAvailableOnly: true, type: params?.type });

    assert(notes.length === ids.length, 'invalid note ids');

    if (params) {
      assert(
        notes.every(({ fileId }) => Boolean(fileId) === params.withFile),
        'invalid note file type',
      );
    }
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    const descantIds = await this.repo.entities.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }

    const parent = await this.repo.notes.findOneById(parentId, { isAvailableOnly: true });
    const children = await this.repo.notes.findAll({ id: childrenIds, isAvailableOnly: true });

    assert(parent && children.every(({ type }) => type === parent.type));
  }

  @BaseService.transaction
  public async query(q: ClientNoteQuery) {
    const notes = await this.repo.notes.findAll({
      ...q,
      parentId: q.parentId || null,
      isAvailableOnly: true,
    });

    return await this.toVO(notes);
  }

  @BaseService.transaction
  public async queryOneById(id: Note['id']) {
    const note = await this.repo.notes.findOneById(id, { isAvailableOnly: true });

    assert(note);
    return await this.toVO(note);
  }

  @BaseService.transaction
  public async queryBlob(noteId: Note['id']) {
    const blob = await this.repo.notes.findBlobById(noteId, { isAvailableOnly: true });
    assert(blob);

    return blob;
  }
}
