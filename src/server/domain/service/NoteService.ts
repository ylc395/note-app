import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';
import intersection from 'lodash/intersection';
import dayjs from 'dayjs';

import { buildIndex } from 'utils/collection';
import {
  type RawNoteVO,
  type NoteBodyDTO,
  type NoteDTO,
  type NoteQuery,
  type NotesDTO,
  type NotePath,
  type NoteBodyVO,
  normalizeTitle,
} from 'interface/note';
import { EntityTypes } from 'interface/entity';
import BaseService from './BaseService';
import RevisionService from './RevisionService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';

export const events = {
  bodyUpdated: 'updated.content.note',
};

export interface NoteBodyUpdatedEvent {
  id: RawNoteVO['id'];
  type: EntityTypes.Note;
  content: NoteBodyVO;
}

@Injectable()
export default class NoteService extends BaseService {
  @Inject() private readonly revisionService!: RevisionService;
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;
  @Inject(forwardRef(() => StarService)) private readonly starService!: StarService;

  async create(note: NoteDTO) {
    return await this.db.transaction(async () => {
      if (note.parentId && !(await this.areAvailable(note.parentId))) {
        throw new Error('invalid parentId');
      }

      if (note.duplicateFrom) {
        return { ...(await this.duplicate(note.duplicateFrom)), isStar: false };
      }

      return { ...(await this.notes.create(note)), isStar: false };
    });
  }

  private async duplicate(noteId: RawNoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('note unavailable');
    }

    const targetNote = await this.notes.findOneById(noteId);
    const targetNoteBody = await this.notes.findBody(noteId);

    if (!targetNote || targetNoteBody === null) {
      throw new Error('invalid duplicate target');
    }

    targetNote.title = `${normalizeTitle(targetNote)} - 副本`;

    const newNote = await this.notes.create(omit(targetNote, ['id', 'createdAt', 'updatedAt']));

    await this.notes.updateBody(noteId, targetNoteBody);
    return newNote;
  }

  async update(noteId: RawNoteVO['id'], note: NoteDTO) {
    await this.assertValidChanges([{ ...note, id: noteId }]);

    const result = await this.notes.update(noteId, { ...note, updatedAt: dayjs().unix() });

    if (!result) {
      throw new Error('invalid id');
    }

    const isStar = await this.starService.isStar({ type: EntityTypes.Note, id: noteId });

    return { ...result, isStar };
  }

  async updateBody(noteId: RawNoteVO['id'], { content, isImportant }: NoteBodyDTO) {
    const result = await this.db.transaction(async () => {
      if (!(await this.isWritable(noteId))) {
        throw new Error('note unavailable');
      }

      const result = await this.notes.updateBody(noteId, content);

      if (result === null) {
        throw new Error('update note body failed');
      }

      await this.notes.update(noteId, { updatedAt: dayjs().unix() });

      if (isImportant) {
        await this.revisionService.createRevision({ content, type: EntityTypes.Note, id: noteId }, true);
      }

      return result;
    });

    this.eventEmitter.emit(events.bodyUpdated, {
      id: noteId,
      type: EntityTypes.Note,
      content,
    } as NoteBodyUpdatedEvent);

    return result;
  }

  async getBody(noteId: RawNoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('note unavailable');
    }

    const result = await this.notes.findBody(noteId);

    if (result === null) {
      throw new Error('note unavailable');
    }

    return result;
  }

  async batchUpdate(notes: NotesDTO) {
    await this.assertValidChanges(notes);
    const result = await this.notes.batchUpdate(notes);

    if (result.length !== notes.length) {
      throw new Error('invalid notes');
    }

    const areStars = await this.starService.areStars(
      EntityTypes.Note,
      notes.map(({ id }) => id),
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result.map((note) => ({ ...note, isStar: areStars[note.id]! }));
  }

  async query(q: NoteQuery) {
    const notes = await this.notes.findAll(q);
    const areRecyclables = await this.recyclableService.areRecyclables(
      EntityTypes.Note,
      notes.map((note) => note.id),
    );
    const areStars = await this.starService.areStars(
      EntityTypes.Note,
      notes.map(({ id }) => id),
    );

    return notes
      .filter((note) => !areRecyclables[note.id])
      .map((note) => ({ ...note, isStar: Boolean(areStars[note.id]) }));
  }

  async queryOne(noteId: RawNoteVO['id']) {
    const note = await this.notes.findOneById(noteId);

    if (!note) {
      throw new Error('not found');
    }

    const locator = { type: EntityTypes.Note, id: noteId };
    const isRecyclable = await this.recyclableService.isRecyclable(locator);

    if (isRecyclable) {
      throw new Error('not found');
    }

    return { ...note, isStar: await this.starService.isStar(locator) };
  }

  async getTreeFragment(noteId: RawNoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('invalid id');
    }

    const notes = await this.notes.findTreeFragment(noteId);
    const areStars = await this.starService.areStars(
      EntityTypes.Note,
      notes.map(({ id }) => id),
    );
    const parents = groupBy(notes, 'parentId');
    const result: RawNoteVO[] = notes.filter(({ parentId }) => parentId === null);

    for (let i = 0; result[i]; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { id } = result[i]!;
      const children = parents[id];

      if (children) {
        result.push(...children);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result.map((note) => ({ ...note, isStar: areStars[note.id]! }));
  }

  // todo: unused, maybe remove
  async getTreePath(noteId: RawNoteVO['id']) {
    if (!(await this.areAvailable(noteId))) {
      throw new Error('invalid id');
    }

    const notes = await this.notes.findTreeFragment(noteId);
    const notesIndex = buildIndex(notes);

    let currentNote: RawNoteVO | undefined = notesIndex[noteId];
    const path: NotePath = [];

    while (currentNote) {
      path.unshift({
        id: currentNote.id,
        title: normalizeTitle(currentNote),
        icon: currentNote.icon,
        siblings: notes
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .filter(({ parentId, id }) => id !== currentNote!.id && parentId === currentNote!.parentId)
          .map((note) => ({ ...note, title: normalizeTitle(note) })),
      });

      currentNote = currentNote.parentId ? notesIndex[currentNote.parentId] : undefined;
    }

    return path;
  }

  private async assertValidChanges(notes: NotesDTO) {
    const ids = notes.map(({ id }) => id);

    if (!(await this.areAvailable(ids))) {
      throw new Error('invalid ids');
    }

    const parentChangedNotes = notes.filter((parent) => typeof parent !== undefined);

    if (parentChangedNotes.length === 0) {
      return;
    }

    for (const { parentId, id } of parentChangedNotes) {
      if (parentId === id) {
        throw new Error(`invalid parent id: ${parentId}`);
      }
    }

    const parentChangedNoteIds = parentChangedNotes.map(({ id }) => id);
    const descendantIds = await this.notes.findAllDescendantIds(parentChangedNoteIds);
    const invalidParentIds = intersection(
      descendantIds,
      parentChangedNotes.map(({ parentId }) => parentId).filter((id) => id),
    );

    if (invalidParentIds.length > 0) {
      throw new Error(`invalid parent id: ${invalidParentIds.join()}`);
    }
  }

  async areAvailable(noteIds: RawNoteVO['id'][] | RawNoteVO['id']) {
    if (Array.isArray(noteIds)) {
      const rows = await this.notes.findAll({ id: noteIds });

      if (rows.length !== noteIds.length) {
        return false;
      }

      const areRecyclables = Object.values(await this.recyclableService.areRecyclables(EntityTypes.Note, noteIds));
      return areRecyclables.every((v) => v === false);
    }

    return (
      Boolean(await this.notes.findOneById(noteIds)) &&
      !(await this.recyclableService.isRecyclable({ type: EntityTypes.Note, id: noteIds }))
    );
  }

  private async isWritable(noteId: RawNoteVO['id']) {
    const row = await this.notes.findOneById(noteId);

    if (!row) {
      return false;
    }

    return !(await this.recyclableService.isRecyclable({ type: EntityTypes.Note, id: noteId }));
  }
}
