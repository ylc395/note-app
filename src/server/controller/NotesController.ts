import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Query } from './decorators';
import {
  type NewNoteDTO,
  type NoteVO,
  type ClientNoteQuery,
  type NotesPatchDTO,
  type NotePatchDTO,
  type DetailedNoteVO,
  type NewNoteParams,
  newNoteDTOSchema,
  newNoteParamsSchema,
  notesPatchDTOSchema,
  clientNoteQuerySchema,
  notePatchDTOSchema,
} from '@domain/model/note';
import NoteService from '@domain/service/NoteService';

@Controller()
export default class NotesController {
  constructor(private readonly noteService: NoteService) {}

  @Get('/notes')
  async query(
    @Query(createSchemaPipe(clientNoteQuerySchema)) { parentId = null, to }: ClientNoteQuery,
  ): Promise<NoteVO[]> {
    return to ? await this.noteService.getTreeFragment(to) : await this.noteService.queryNotes({ parentId });
  }

  @Post('/notes')
  async create(
    @Body(createSchemaPipe(newNoteDTOSchema)) noteDTO: NewNoteDTO,
    @Query(createSchemaPipe(newNoteParamsSchema)) { from }: NewNoteParams,
  ): Promise<NoteVO> {
    return await this.noteService.create(noteDTO, from);
  }

  @Patch('/notes')
  async batchUpdate(@Body(createSchemaPipe(notesPatchDTOSchema)) { ids, note }: NotesPatchDTO): Promise<void> {
    return await this.noteService.batchUpdate(ids, note);
  }

  @Get('/notes/:id')
  async queryOne(@Param('id') noteId: string): Promise<DetailedNoteVO> {
    return await this.noteService.queryOneNote(noteId);
  }

  @Patch('/notes/:id')
  async updateOne(
    @Param('id') noteId: string,
    @Body(createSchemaPipe(notePatchDTOSchema)) patch: NotePatchDTO,
  ): Promise<void> {
    return await this.noteService.updateOne(noteId, patch);
  }
}
