import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Query, Put } from './decorators.js';
import {
  type NewNoteDTO,
  type NoteVO,
  type ClientNoteQuery,
  type NotesPatchDTO,
  type NotePatchDTO,
  type NewNoteParams,
  newNoteDTOSchema,
  newNoteParamsSchema,
  notesPatchDTOSchema,
  clientNoteQuerySchema,
  notePatchDTOSchema,
} from '@domain/model/note.js';
import NoteService from '@domain/service/NoteService.js';

@Controller()
export default class NotesController {
  constructor(private readonly noteService: NoteService) {}

  @Get('/notes/:id/body')
  async queryBody(@Param('id') noteId: string): Promise<string> {
    return await this.noteService.queryBody(noteId);
  }

  @Put('/notes/:id/body')
  async updateBody(@Param('id') noteId: string, @Body() body: string): Promise<void> {
    return await this.noteService.updateBody(noteId, body);
  }

  @Get('/notes/:id')
  async queryOne(@Param('id') noteId: string): Promise<NoteVO> {
    return await this.noteService.queryOne(noteId);
  }

  @Patch('/notes/:id')
  async updateOne(
    @Param('id') noteId: string,
    @Body(createSchemaPipe(notePatchDTOSchema)) patch: NotePatchDTO,
  ): Promise<void> {
    return await this.noteService.updateOne(noteId, patch);
  }

  @Get('/notes')
  async query(
    @Query(createSchemaPipe(clientNoteQuerySchema)) { parentId = null, to }: ClientNoteQuery,
  ): Promise<NoteVO[]> {
    return to ? await this.noteService.getTreeFragment(to) : await this.noteService.query({ parentId });
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
}
