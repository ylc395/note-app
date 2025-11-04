import assert from 'node:assert';
import { keyBy, omit, pick, uniq } from 'lodash-es';
import {
  type NoteVO,
  type NoteDTO,
  type NotePatchDTO,
  type Note,
  type ClientNoteQuery,
  type NewNote,
  type FileTextQuery,
  normalizeTitle,
  type NewNoteDTO,
} from '#domain/server/model/note.js';
import { arrayOf } from '#utils/collection.js';
import container from '#utils/singletonContainer.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import ContentService from './ContentService/index.js';
import FileService from './FileService/index.js';

export default class NoteService extends BaseService {
  private readonly content = container.resolve(ContentService);

  private readonly file = container.resolve(FileService);

  @BaseService.transaction
  public async create(note: NoteDTO) {
    let newNote: NewNote;

    if ('from' in note) {
      newNote = await this.duplicate(note.from);
    } else {
      await this.assertValidPatch(note);
      const now = Date.now();

      newNote = await this.repo.notes.create({
        id: EntityService.generateId(),
        title: note.title || '',
        parentId: note.parentId || null,
        body: note.body || '',
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

    return this.queryOneById(newNote.id);
  }

  private async duplicate(fromNoteId: Note['id']) {
    const targetNote = await this.repo.notes.findOneById(fromNoteId, { isAvailableOnly: true });
    assert(targetNote);

    const now = Date.now();

    return await this.repo.notes.create({
      ...pick(targetNote, ['body', 'icon', 'parentId', 'sourceUrl', 'fileId']),
      title: targetNote.title ? `${targetNote.title}-副本` : `${normalizeTitle(targetNote)}-副本`,
      id: EntityService.generateId(),
      updatedAt: now,
      createdAt: now,
    });
  }

  @BaseService.transaction
  public async updateOne(noteId: Note['id'], notePatch: NotePatchDTO) {
    await this.assertValidPatch(notePatch, [noteId]);

    const hasContentUpdated = typeof notePatch.title === 'string' || typeof notePatch.body === 'string';
    await this.repo.notes.update(noteId, {
      ...notePatch,
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
    const stars = isNew ? {} : keyBy(await this.repo.stars.findAll({ entityIds: ids }), ({ entityId }) => entityId);
    const children = isNew ? {} : await this.repo.entities.findChildrenIds(ids, { isAvailableOnly: true });

    const result: NoteVO[] = _notes.map((note) => ({
      ...omit(note, ['fileId']),
      childrenCount: children[note.id]?.length || 0,
      isStar: Boolean(stars[note.id]),
    }));

    return Array.isArray(notes) ? result : result[0]!;
  }

  @BaseService.transaction
  public async batchUpdate(ids: Note['id'][], patch: NotePatchDTO) {
    await this.assertValidPatch(patch, ids);
    const result = await this.repo.notes.update(ids, patch);
    assert(result);
  }

  public async assertAvailableIds(ids: Note['id'][], params?: { withFile?: boolean }) {
    ids = uniq(ids);
    const notes = await this.repo.notes.findAll({ id: ids, isAvailableOnly: true });

    assert(notes.length === ids.length, 'invalid note ids');

    if (params?.withFile) {
      assert(
        notes.every(({ fileId }) => Boolean(fileId) === params.withFile),
        'invalid note file type',
      );
    }
  }

  @BaseService.transaction
  public async query(q: ClientNoteQuery) {
    const notes = await this.repo.notes.findAll({
      ...q,
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

  public async queryFileText(q: FileTextQuery) {
    await this.assertAvailableIds([q.id]);
    return this.repo.notes.findFileTextLocation(q.id, q);
  }

  private async assertValidPatch(patch: NewNoteDTO, targetIds?: Note['id'][]) {
    if (patch.parentId) {
      assert(targetIds);
    }

    await Promise.all([
      targetIds && this.assertAvailableIds(targetIds),
      patch.icon?.type === 'file' && this.file.assertId(patch.icon.code, (mimeType) => mimeType.startsWith('image')),
      patch.parentId && this.assertValidParent(patch.parentId, targetIds!),
      patch.fileId && this.file.assertId(patch.fileId),
    ]);
  }

  private async assertValidParent(parentId: Note['id'], childrenIds: Note['id'][]) {
    await this.assertAvailableIds([parentId]);
    const descantIds = await this.repo.entities.findDescendantIds(childrenIds);

    for (const id of childrenIds) {
      assert(parentId !== id && !descantIds[id]?.includes(parentId));
    }
  }
}
