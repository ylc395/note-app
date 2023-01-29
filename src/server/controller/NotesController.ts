import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Put, Query } from './decorators';
import {
  type NoteDTO,
  type NoteBodyDTO,
  type NoteBodyVO,
  type NoteVO,
  type NoteQuery,
  noteDTOSchema,
} from 'interface/Note';
import NoteService from 'service/NoteService';

@Controller()
export default class NotesController {
  constructor(private noteService: NoteService) {}

  @Post('/notes')
  async create(@Body(createSchemaPipe(noteDTOSchema)) noteDTO: NoteDTO): Promise<NoteVO> {
    return await this.noteService.create(noteDTO);
  }

  @Get('/notes')
  async query(@Query() q: NoteQuery): Promise<NoteVO[]> {
    return await this.noteService.query(q);
  }

  @Patch('/notes/:id')
  async update(
    @Param('id') noteId: NoteVO['id'],
    @Body(createSchemaPipe(noteDTOSchema)) note: NoteDTO,
  ): Promise<NoteVO> {
    return await this.noteService.update(noteId, note);
  }

  @Get('/notes/:id')
  async queryOne(@Param('id') noteId: NoteVO['id']): Promise<NoteVO> {
    const note = (await this.noteService.query({ id: noteId }))[0];

    if (!note) {
      throw new Error('not found');
    }

    return note;
  }

  @Get('/notes/:id/body')
  async getBody(@Param('id') noteId: NoteVO['id']): Promise<NoteBodyVO | null> {
    return await this.noteService.getBody(noteId);
  }

  @Put('/notes/:id/body')
  async updateBody(@Param('id') noteId: NoteVO['id'], @Body() body: NoteBodyDTO): Promise<NoteBodyVO> {
    return await this.noteService.updateBody(noteId, body);
  }
}
