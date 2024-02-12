import { container } from 'tsyringe';
import { string, tuple } from 'zod';

import { noteDTOSchema, clientNoteQuerySchema, notePatchDTOSchema } from '@domain/model/note.js';
import NoteService from '@domain/service/NoteService.js';
import { publicProcedure, router } from './trpc.js';

const noteProcedure = publicProcedure.use(({ next }) => {
  return next({ ctx: { noteService: container.resolve(NoteService) } });
});

export default router({
  query: noteProcedure.input(clientNoteQuerySchema).query(({ input: { to, parentId }, ctx: { noteService } }) => {
    return to ? noteService.getTreeFragment(to) : noteService.query({ parentId });
  }),

  queryOne: noteProcedure
    .input(string())
    .query(({ input: noteId, ctx: { noteService } }) => noteService.queryOne(noteId)),

  updateOne: noteProcedure
    .input(tuple([string(), notePatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { noteService } }) => noteService.updateOne(id, patch)),

  batchUpdate: noteProcedure
    .input(tuple([string().array(), notePatchDTOSchema]))
    .mutation(({ input: [ids, note], ctx: { noteService } }) => noteService.batchUpdate(ids, note)),

  create: noteProcedure
    .input(noteDTOSchema.extend({ from: string().optional() }))
    .mutation(({ input: { from, ...dto }, ctx: { noteService } }) => noteService.create(dto, from)),
});
