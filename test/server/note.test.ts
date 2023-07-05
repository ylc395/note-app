import { describe, it } from 'mocha';
import { strictEqual } from 'node:assert';

import NotesController from '../../dist/electron/server/controller/NotesController';

describe('notes', async function () {
  it('should create some notes', async function () {
    const noteController: NotesController = this.nestModule.get(NotesController);
    const note = await noteController.create({ title: 'test title' });

    strictEqual(note.title, 'test title');
  });
});
