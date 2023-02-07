import { Controller } from '@nestjs/common';

import { Post, Body, Get, Patch, createSchemaPipe, Param, Put, Query } from './decorators';
import {
  type NoteDTO,
  type NoteBodyDTO,
  type NoteBodyVO,
  type NoteVO,
  type NoteQuery,
  noteDTOSchema,
  notesDTOSchema,
  noteQuerySchema,
  NotesDTO,
} from 'interface/Note';
import NoteService from 'service/NoteService';

@Controller()
export default class NotesController {
  constructor(private noteService: NoteService) {}

  @Post('/notes')
  async create(@Body(createSchemaPipe(noteDTOSchema)) noteDTO: NoteDTO): Promise<NoteVO> {
    return await this.noteService.create(noteDTO);
  }

  @Patch('/notes')
  async batchUpdate(@Body(createSchemaPipe(notesDTOSchema)) notesDTO: NotesDTO): Promise<NoteVO[]> {
    return await this.noteService.batchUpdate(notesDTO);
  }

  @Get('/notes')
  async query(@Query(createSchemaPipe(noteQuerySchema)) q: NoteQuery): Promise<NoteVO[]> {
    return await this.noteService.query(q);
  }

  @Get('/notes/:id/ancestors')
  async queryAncestors(@Param('id') noteId: string): Promise<NoteVO[]> {
    return await this.noteService.getAncestors(noteId);
  }

  @Patch('/notes/:id')
  async update(@Param('id') noteId: string, @Body(createSchemaPipe(noteDTOSchema)) note: NoteDTO): Promise<NoteVO> {
    return await this.noteService.update(noteId, note);
  }

  @Get('/notes/:id')
  async queryOne(@Param('id') noteId: string): Promise<NoteVO> {
    const note = (await this.noteService.query({ id: noteId }))[0];

    if (!note) {
      throw new Error('not found');
    }

    return note;
  }

  @Get('/notes/:id/body')
  async getBody(@Param('id') noteId: string): Promise<NoteBodyVO> {
    return await this.noteService.getBody(noteId);
  }

  @Put('/notes/:id/body')
  async updateBody(@Param('id') noteId: string, @Body() body: NoteBodyDTO): Promise<NoteBodyVO> {
    return await this.noteService.updateBody(noteId, body);
  }
}
