/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, before } from 'mocha';
import { strictEqual, deepStrictEqual, ok, rejects } from 'node:assert';

import NotesController from '../../dist/electron/server/controller/NotesController';
import type { NoteVO } from '../../dist/electron/shared/interface/note';

describe('notes', async function () {
  let noteController: NotesController;
  let rootNotes: NoteVO[] = [];
  let parentNoteId: NoteVO['id'];
  let grandChildNoteId: NoteVO['id'];
  let children: NoteVO[] = [];
  const CHILDREN_COUNT = 4;

  before(function () {
    noteController = this.nestModule.get(NotesController);
  });

  it('should create some notes', async function () {
    for (let i = 0; i < 4; i++) {
      rootNotes.push(await noteController.create({ title: `test title${i}`, isReadonly: i < 2 }));
    }

    for (const [i, note] of rootNotes.entries()) {
      strictEqual(note.title, `test title${i}`);
      strictEqual(note.parentId, null);
      strictEqual(note.childrenCount, 0);
      strictEqual(note.isReadonly, i < 2);
    }
  });

  it('should get empty body for new note', async function () {
    for (const note of rootNotes) {
      const body = await noteController.queryBody(note.id);
      strictEqual(body, '');
    }
  });

  it('should write body, respecting isReadonly', async function () {
    for (const [i, note] of rootNotes.entries()) {
      if (i < 2) {
        await rejects(noteController.updateBody(note.id, { content: 'test body' }));
      } else {
        const body = await noteController.updateBody(note.id, { content: 'test body' });
        strictEqual(body, 'test body');
      }
    }

    await rejects(noteController.updateBody('some invalid note id', { content: 'test body' }));
  });

  it('should get right body', async function () {
    for (const note of rootNotes) {
      const body = await noteController.queryBody(note.id);
      strictEqual(body, note.isReadonly ? '' : 'test body');
    }
  });

  it('should create some children notes', async function () {
    parentNoteId = rootNotes[0]!.id;

    for (let i = 0; i < CHILDREN_COUNT; i++) {
      const child = await noteController.create({ title: `test title${i}`, parentId: parentNoteId });
      strictEqual(child.parentId, parentNoteId);
      children.push(child);
    }

    await rejects(noteController.create({ parentId: 'some invalid id' }));
  });

  it('should query root notes', async function () {
    const targetNoteId = rootNotes[0]!.id;
    const notesFounded = await noteController.query({ parentId: null });

    strictEqual(notesFounded.length, rootNotes.length);

    for (const note of notesFounded) {
      ok(rootNotes.find(({ id }) => note.id === id));
      strictEqual(note.childrenCount, note.id === targetNoteId ? children.length : 0);
    }

    rootNotes = notesFounded;
  });

  it('should query some children notes', async function () {
    const targetNoteId = rootNotes[0]!.id;
    const notesFounded = await noteController.query({ parentId: targetNoteId });

    strictEqual(notesFounded.length, children.length);

    for (const note of notesFounded) {
      ok(children.find(({ id }) => note.id === id));
    }
  });

  it('should query specified note', async function () {
    for (const note of rootNotes) {
      deepStrictEqual(await noteController.queryOne(note.id), note);
    }

    await rejects(noteController.queryOne('a invalid id'));
  });

  it('should update one note', async function () {
    const targetNoteId = rootNotes[0]!.id;
    await noteController.update(targetNoteId, { title: 'new test title', isReadonly: false });
    const updatedNote = await noteController.queryOne(targetNoteId);

    strictEqual(updatedNote.title, 'new test title');
    strictEqual(updatedNote.isReadonly, false);
    rejects(noteController.update('invalid id', { title: 'new test title' }));
  });

  it("update one's parentId correctly", async function () {
    const childNoteId = children[0]!.id;
    const targetNoteId = rootNotes[1]!.id;
    const childNoteId2 = children[1]!.id;

    grandChildNoteId = (await noteController.update(targetNoteId, { parentId: childNoteId })).id;
    await noteController.update(childNoteId2, { parentId: null });

    const newRootNotes = await noteController.query({ parentId: null });
    const newChildren = await noteController.query({ parentId: parentNoteId });

    strictEqual(newRootNotes.length, rootNotes.length);
    strictEqual(newChildren.length, children.length - 1);
    ok(!newRootNotes.find((note) => note.id === targetNoteId));
    ok(!newChildren.find((note) => note.id === childNoteId2));
    ok(newRootNotes.find((note) => note.id === childNoteId2));

    rootNotes = newRootNotes;
    children = newChildren;
  });

  it('should reject invalid updates', async function () {
    const childNote = children[0];

    await rejects(noteController.update(parentNoteId, { parentId: 'invalid id' }));
    await rejects(noteController.update(parentNoteId, { parentId: parentNoteId }));
    await rejects(noteController.update(parentNoteId, { parentId: childNote!.id }));
    await rejects(noteController.update(parentNoteId, { parentId: grandChildNoteId }));
    await rejects(noteController.update(childNote!.id, { parentId: grandChildNoteId }));
    strictEqual((await noteController.queryOne(parentNoteId)).parentId, null);
    strictEqual((await noteController.queryOne(childNote!.id)).parentId, childNote!.parentId);
  });

  it('should batch update notes', async function () {
    await noteController.batchUpdate([
      ...rootNotes.map(({ id }) => ({ id, title: 'batch updated title' })),
      ...children.map(({ id }) => ({ id, title: 'batch updated title' })),
    ]);

    children = await noteController.query({ parentId: rootNotes[0]!.id });
    rootNotes = await noteController.query({ parentId: null });

    for (const note of [...rootNotes, ...children]) {
      strictEqual(note.title, 'batch updated title');
    }
  });

  it('should batch update parent ids', async () => {
    const rootNote = rootNotes[rootNotes.length - 1]!;
    const toBeGrandChildren = [
      { id: rootNote.id, parentId: grandChildNoteId },
      ...children.slice(2).map(({ id }) => ({ id, parentId: grandChildNoteId })),
    ];
    const toBeNewRoot = children.slice(0, 2).map(({ id }) => ({ id, parentId: null }));

    await noteController.batchUpdate([...toBeGrandChildren, ...toBeNewRoot]);

    children = await noteController.query({ parentId: parentNoteId });
    strictEqual(children.length, 0);

    const newRootNotes = await noteController.query({ parentId: null });
    strictEqual(newRootNotes.length, rootNotes.length - 1 + toBeNewRoot.length);
    rootNotes = newRootNotes;
    parentNoteId = grandChildNoteId;
    grandChildNoteId = toBeGrandChildren[0]!.id;
  });

  it('should reject invalid batch updates', async function () {
    await rejects(
      noteController.batchUpdate([
        { id: parentNoteId, parentId: grandChildNoteId },
        ...rootNotes.filter(({ id }) => id !== parentNoteId).map(({ id }) => ({ id, parentId: grandChildNoteId })),
      ]),
    );
  });

  it('should duplicate one note', async function () {
    const newNote = await noteController.create({ parentId: parentNoteId });
    await noteController.updateBody(newNote.id, { content: 'new body' });
    await noteController.update(newNote.id, { isReadonly: true });

    const duplicatedNote = await noteController.create({ duplicateFrom: newNote.id });
    deepStrictEqual(duplicatedNote, await noteController.queryOne(duplicatedNote.id));
    strictEqual(await noteController.queryBody(duplicatedNote.id), 'new body');
    strictEqual(duplicatedNote.isReadonly, true);
  });
});
