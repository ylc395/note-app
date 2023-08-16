import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Put, Query } from './decorators';
import {
  type ClientNewNote,
  type NoteBody,
  type ClientNote,
  type ClientNoteQuery,
  type ClientNotesPatch,
  type ClientNotePatch,
  ClientNewNoteSchema,
  ClientNotesPatchSchema,
  clientNoteQuerySchema,
  noteBodySchema,
  ClientNotePatchSchema,
} from 'model/note';
import type { NoteTreeVO } from 'model/note/Tree';
import NoteService from 'service/NoteService';

@Controller()
export default class NotesController {
  constructor(private noteService: NoteService) {}

  @Post('/notes')
  async create(@Body(createSchemaPipe(ClientNewNoteSchema)) noteDTO: ClientNewNote): Promise<ClientNote> {
    return await this.noteService.create(noteDTO);
  }

  @Patch('/notes')
  async batchUpdate(@Body(createSchemaPipe(ClientNotesPatchSchema)) notesDTO: ClientNotesPatch): Promise<ClientNote[]> {
    return await this.noteService.batchUpdate(notesDTO);
  }

  @Get('/notes')
  async query(@Query(createSchemaPipe(clientNoteQuerySchema)) q: ClientNoteQuery): Promise<ClientNote[]> {
    return await this.noteService.queryVO({ parentId: null, ...q });
  }

  @Get('/notes/:id/tree')
  async queryTree(@Param('id') noteId: string): Promise<NoteTreeVO> {
    return await this.noteService.getTreeFragment(noteId);
  }

  @Patch('/notes/:id')
  async update(
    @Param('id') noteId: string,
    @Body(createSchemaPipe(ClientNotePatchSchema)) note: ClientNotePatch,
  ): Promise<ClientNote> {
    return await this.noteService.update(noteId, note);
  }

  @Get('/notes/:id')
  async queryOne(@Param('id') noteId: string): Promise<ClientNote> {
    return await this.noteService.queryVO(noteId);
  }

  @Get('/notes/:id/body')
  async queryBody(@Param('id') noteId: string): Promise<NoteBody> {
    return await this.noteService.queryBody(noteId);
  }

  @Put('/notes/:id/body')
  async updateBody(
    @Param('id') noteId: string,
    @Body(createSchemaPipe(noteBodySchema)) body: NoteBody,
  ): Promise<NoteBody> {
    return await this.noteService.updateBody(noteId, body);
  }
}
