import { describe, it, before } from 'mocha';
import { strictEqual, deepStrictEqual, ok, rejects } from 'node:assert';

import NotesController from '../../dist/electron/server/controller/NotesController';
import RecyclablesController from '../../dist/electron/server/controller/RecyclablesController';
import { EntityTypes } from '../../dist/electron/shared/model/entity';
import type { NoteVO } from '../../dist/electron/shared/model/note';

describe('notes', function () {
  let noteController: NotesController;
  let recyclablesController: RecyclablesController;

  before(function () {
    noteController = this.nestModule.get(NotesController);
    recyclablesController = this.nestModule.get(RecyclablesController);
  });

  let rootNotes: NoteVO[];
  let parentNoteId: NoteVO['id'];
  let grandChildNoteId: NoteVO['id'];

  it('should create some root notes', async function () {
    rootNotes = [
      await noteController.create({ title: 'test title' }),
      await noteController.create({ title: '' }),
      await noteController.create({ title: 'test title', isReadonly: true }),
    ];

    for (const note of rootNotes) {
      ok(typeof note.id === 'string');
    }
  });

  it('should has a normalized title (not empty) ', function () {
    ok(rootNotes[1]?.title);
  });

  it('should query root notes', async function () {
    const notes = await noteController.query({});
    strictEqual(rootNotes.length, 3);

    for (const note of notes) {
      deepStrictEqual(
        note,
        rootNotes.find(({ id }) => id === note.id),
      );
    }
  });

  it('should query specified note by id, and fail for an invalid id', async function () {
    for (const note of rootNotes) {
      deepStrictEqual(await noteController.queryOne(note.id), note);
    }

    await rejects(noteController.queryOne('a invalid id'));
  });

  it('should get empty body for new note', async function () {
    for (const note of rootNotes) {
      const body = await noteController.queryBody(note.id);
      strictEqual(body, '');
    }
  });

  it('should write body, respecting isReadonly', async function () {
    for (const note of rootNotes) {
      if (note.isReadonly) {
        await rejects(noteController.updateBody(note.id, 'test body'));
      } else {
        const body = await noteController.updateBody(note.id, 'test body');
        strictEqual(body, 'test body');
      }
    }

    await rejects(noteController.updateBody('some invalid note id', 'test body'));
  });

  it('should get right body', async function () {
    for (const note of rootNotes) {
      const body = await noteController.queryBody(note.id);
      strictEqual(body, note.isReadonly ? '' : 'test body');
    }
  });

  it('should create some children notes', async function () {
    const parentNote = await noteController.create({});
    parentNoteId = parentNote.id;

    await noteController.create({ parentId: parentNoteId });
    await noteController.create({ parentId: parentNoteId, title: 'child note1' });
    await noteController.create({ parentId: parentNoteId, title: 'child 2' });
    await rejects(noteController.create({ parentId: 'some invalid id' }));
  });

  it('should fail when parent id is invalid for creating', async function () {
    await rejects(noteController.create({ parentId: 'invalid id' }));
  });

  it('should query children notes, and right childrenCount', async function () {
    const parentNote = await noteController.queryOne(parentNoteId);
    const children = await noteController.query({ parentId: parentNote.id });

    strictEqual(children.length, 3);
    strictEqual(parentNote.childrenCount, children.length);

    for (const child of children) {
      strictEqual(child.parentId, parentNote.id);
    }
  });

  it('should query a tree by a note id', async function () {
    const rootNotes = await noteController.query({ parentId: null });
    const parentNote = await noteController.queryOne(parentNoteId);
    const children = await noteController.query({ parentId: parentNote.id });
    const grandChildNote1 = await noteController.create({ parentId: children[0]!.id });
    const grandChildNote2 = await noteController.create({ parentId: children[0]!.id });

    const tree = await noteController.queryTree(grandChildNote1.id);
    const parentNode = tree.find(({ entity: { id } }) => id === parentNoteId);
    const childNode = parentNode?.children?.find(({ entity: { id } }) => id === children[0]!.id);

    ok(tree.length === rootNotes.length);
    ok(parentNode?.children?.length === children.length);
    ok(childNode);
    ok(childNode.children?.find(({ entity: { id } }) => id === grandChildNote1.id));
    ok(childNode.children?.find(({ entity: { id } }) => id === grandChildNote2.id));
  });

  it('should update one note, and fail when id is invalid', async function () {
    const targetNoteId = rootNotes[0]!.id;
    await noteController.batchUpdate([{ id: targetNoteId, title: 'new test title', isReadonly: false }]);
    const updatedNote = await noteController.queryOne(targetNoteId);

    strictEqual(updatedNote.title, 'new test title');
    strictEqual(updatedNote.isReadonly, false);
    await rejects(noteController.batchUpdate([{ id: 'invalid id', title: 'new test title' }]));
  });

  it("update one's parentId correctly", async function () {
    const oldChildren = await noteController.query({ parentId: parentNoteId });
    const oldRoots = await noteController.query({ parentId: null });

    const newRootNote = await noteController.create({});
    const childNoteId = oldChildren[0]!.id;
    const childNoteId2 = oldChildren[1]!.id;

    grandChildNoteId = newRootNote.id;
    await noteController.batchUpdate([{ id: grandChildNoteId, parentId: childNoteId }]);
    await noteController.batchUpdate([{ id: childNoteId2, parentId: null }]);

    const newRoots = await noteController.query({ parentId: null });
    const newChildren = await noteController.query({ parentId: parentNoteId });

    strictEqual(newRoots.length, oldRoots.length + 1);
    strictEqual(newChildren.length, oldChildren.length - 1);
    ok(!newRoots.find((note) => note.id === newRootNote.id));
    ok(!newChildren.find((note) => note.id === childNoteId2));
    ok(newRoots.find((note) => note.id === childNoteId2));
  });

  it('should reject invalid updates', async function () {
    const children = await noteController.query({ parentId: parentNoteId });
    const childNote = children[0]!;

    await rejects(noteController.batchUpdate([{ id: parentNoteId, parentId: 'invalid id' }]));
    await rejects(noteController.batchUpdate([{ id: parentNoteId, parentId: parentNoteId }]));
    await rejects(noteController.batchUpdate([{ id: parentNoteId, parentId: childNote!.id }]));
    await rejects(noteController.batchUpdate([{ id: parentNoteId, parentId: grandChildNoteId }]));
    await rejects(noteController.batchUpdate([{ id: childNote!.id, parentId: grandChildNoteId }]));
    strictEqual((await noteController.queryOne(parentNoteId)).parentId, null);
    strictEqual((await noteController.queryOne(childNote!.id)).parentId, childNote!.parentId);
  });

  it('should batch update notes', async function () {
    let rootNotes = await noteController.query({ parentId: null });
    let children = await noteController.query({ parentId: rootNotes[0]!.id });

    const updatedNotes = await noteController.batchUpdate([
      ...rootNotes.map(({ id }) => ({ id, title: 'batch updated title' })),
      ...children.map(({ id }) => ({ id, title: 'batch updated title' })),
    ]);

    for (const note of updatedNotes) {
      strictEqual(note.title, 'batch updated title');
    }

    rootNotes = await noteController.query({ parentId: null });
    children = await noteController.query({ parentId: rootNotes[0]!.id });

    for (const note of [...rootNotes, ...children]) {
      strictEqual(note.title, 'batch updated title');
    }
  });

  it('should batch update parent ids', async () => {
    const rootNotes = await noteController.query({ parentId: null });
    let children = await noteController.query({ parentId: parentNoteId });

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
    await noteController.updateBody(newNote.id, 'new body');
    await noteController.batchUpdate([{ id: newNote.id, isReadonly: true }]);

    const duplicatedNote = await noteController.create({ duplicateFrom: newNote.id });
    deepStrictEqual(duplicatedNote, await noteController.queryOne(duplicatedNote.id));
    strictEqual(await noteController.queryBody(duplicatedNote.id), 'new body');
    strictEqual(duplicatedNote.isReadonly, true);
  });

  it('should not query/duplicate/recycle a recyclable note and its body', async function () {
    const newNote = await noteController.create({});
    await recyclablesController.create([{ type: EntityTypes.Note, id: newNote.id }]);

    await rejects(noteController.create({ duplicateFrom: newNote.id }));
    await rejects(noteController.queryOne(newNote.id));
    await rejects(noteController.queryBody(newNote.id));
    await rejects(recyclablesController.create([{ type: EntityTypes.Note, id: newNote.id }]));
  });

  it('should not query/duplicate a note and its body if its ancestor note is recyclable', async function () {
    const newNote = await noteController.create({});
    const newChildNote = await noteController.create({ parentId: newNote.id });
    const newGrandChildNote1 = await noteController.create({ parentId: newChildNote.id });
    const newGrandChildNote2 = await noteController.create({ parentId: newChildNote.id });

    await recyclablesController.create([{ type: EntityTypes.Note, id: newChildNote.id }]);

    await rejects(noteController.create({ duplicateFrom: newGrandChildNote1.id }));
    await rejects(noteController.create({ duplicateFrom: newGrandChildNote2.id }));
    await rejects(noteController.queryOne(newGrandChildNote1.id));
    await rejects(noteController.queryOne(newGrandChildNote2.id));
    await rejects(noteController.queryBody(newGrandChildNote1.id));
    await rejects(noteController.queryBody(newGrandChildNote2.id));
    await rejects(recyclablesController.create([{ type: EntityTypes.Note, id: newGrandChildNote1.id }]));
  });

  it('should get correct childrenCount and children after some children become recyclables', async function () {
    const parent = await noteController.create({ parentId: null });
    const child1 = await noteController.create({ parentId: parent.id });
    const child2 = await noteController.create({ parentId: parent.id });
    const child3 = await noteController.create({ parentId: parent.id });

    await recyclablesController.create([
      { type: EntityTypes.Note, id: child1.id },
      { type: EntityTypes.Note, id: child2.id },
    ]);

    const parentNote = await noteController.queryOne(parent.id);
    strictEqual(parentNote.childrenCount, 1);

    const rootNotes = await noteController.query({ parentId: null });

    for (const { id, childrenCount } of rootNotes) {
      if (id === parent.id) {
        strictEqual(childrenCount, 1);
      }
    }

    const children = await noteController.query({ parentId: parent.id });
    strictEqual(children.length, 1);
    deepStrictEqual(children[0], child3);
  });

  it('can not be a parent if it is a recyclable', async function () {
    const newNote1 = await noteController.create({ parentId: parentNoteId });
    const newNote2 = await noteController.create({});
    await recyclablesController.create([{ type: EntityTypes.Note, id: newNote1.id }]);

    await rejects(noteController.create({ parentId: newNote1.id }));
    await rejects(noteController.batchUpdate([{ id: newNote2.id, parentId: newNote1.id }]));
  });

  it('can not be a parent if its ancestor are recyclable', async function () {
    const newNote = await noteController.create({});
    const newChildNote = await noteController.create({ parentId: newNote.id });
    const newGrandChildNote = await noteController.create({ parentId: newChildNote.id });

    await recyclablesController.create([{ type: EntityTypes.Note, id: newChildNote.id }]);

    await rejects(noteController.create({ parentId: newGrandChildNote.id }));
  });
});
