import { string, tuple } from 'zod';

import { noteDTOSchema, clientNoteQuerySchema, notePatchDTOSchema } from '@domain/model/note.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure
    .input(clientNoteQuerySchema)
    .query(({ input: query, ctx: { noteService } }) => noteService.query(query)),

  queryPath: publicProcedure
    .input(string())
    .query(({ input: noteId, ctx: { noteService } }) => noteService.getPath(noteId)),

  queryOne: publicProcedure
    .input(string())
    .query(({ input: noteId, ctx: { noteService } }) => noteService.queryOne(noteId)),

  updateOne: publicProcedure
    .input(tuple([string(), notePatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { noteService } }) => noteService.updateOne(id, patch)),

  batchUpdate: publicProcedure
    .input(tuple([string().array(), notePatchDTOSchema]))
    .mutation(({ input: [ids, note], ctx: { noteService } }) => noteService.batchUpdate(ids, note)),

  create: publicProcedure
    .input(noteDTOSchema.extend({ from: string().optional() }))
    .mutation(({ input: { from, ...dto }, ctx: { noteService } }) => noteService.create(dto, from)),
});
