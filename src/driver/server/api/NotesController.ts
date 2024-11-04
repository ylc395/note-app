import { string, tuple } from 'zod';

import {
  noteDTOSchema,
  clientNoteQuerySchema,
  notePatchDTOSchema,
  noteSchema,
  noteBatchPatchDTOSchema,
} from '@domain/shared/infra/schema/note.js';
import { publicProcedure, router } from './trpc.js';

export default router({
  query: publicProcedure
    .input(clientNoteQuerySchema)
    .query(({ input: query, ctx: { noteService } }) => noteService.query(query)),

  queryOne: publicProcedure
    .input(string())
    .query(({ input: noteId, ctx: { noteService } }) => noteService.queryOne(noteId)),

  updateOne: publicProcedure
    .input(tuple([noteSchema.shape.id, notePatchDTOSchema]))
    .mutation(({ input: [id, patch], ctx: { noteService } }) => noteService.updateOne(id, patch)),

  batchUpdate: publicProcedure
    .input(tuple([noteSchema.shape.id.array(), noteBatchPatchDTOSchema]))
    .mutation(({ input: [ids, note], ctx: { noteService } }) => noteService.batchUpdate(ids, note)),

  create: publicProcedure.input(noteDTOSchema).mutation(({ input, ctx: { noteService } }) => noteService.create(input)),

  queryPath: publicProcedure
    .input(noteSchema.shape.id)
    .query(({ input: noteId, ctx: { entityService } }) => entityService.getPath(noteId)),
});
