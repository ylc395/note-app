import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Put, Query } from './decorators';
import {
  type NewNoteDTO,
  type NoteBodyDTO,
  type NoteVO,
  type ClientNoteQuery,
  type NotesPatchDTO,
  newNoteDTOSchema,
  notesPatchDTOSchema,
  clientNoteQuerySchema,
  noteBodyDTOSchema,
} from 'model/note';
import type { NoteTreeVO } from 'model/note/Tree';
import NoteService from 'service/NoteService';

@Controller()
export default class NotesController {
  constructor(private noteService: NoteService) {}

  @Post('/notes')
  async create(@Body(createSchemaPipe(newNoteDTOSchema)) noteDTO: NewNoteDTO): Promise<NoteVO> {
    return await this.noteService.create(noteDTO);
  }

  @Patch('/notes')
  async batchUpdate(@Body(createSchemaPipe(notesPatchDTOSchema)) { ids, note }: NotesPatchDTO): Promise<NoteVO[]> {
    return await this.noteService.batchUpdate(ids, note);
  }

  @Get('/notes')
  async query(@Query(createSchemaPipe(clientNoteQuerySchema)) q: ClientNoteQuery): Promise<NoteVO[]> {
    return await this.noteService.queryVO({ parentId: null, ...q });
  }

  @Get('/notes/:id/tree')
  async queryTree(@Param('id') noteId: string): Promise<NoteTreeVO> {
    return await this.noteService.getTreeFragment(noteId);
  }

  @Get('/notes/:id')
  async queryOne(@Param('id') noteId: string): Promise<NoteVO> {
    return await this.noteService.queryVO(noteId);
  }

  @Get('/notes/:id/body')
  async queryBody(@Param('id') noteId: string): Promise<NoteBodyDTO> {
    return await this.noteService.queryBody(noteId);
  }

  @Put('/notes/:id/body')
  async updateBody(
    @Param('id') noteId: string,
    @Body(createSchemaPipe(noteBodyDTOSchema)) body: NoteBodyDTO,
  ): Promise<NoteBodyDTO> {
    return await this.noteService.updateBody(noteId, body);
  }
}
