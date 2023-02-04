import { Controller } from '@nestjs/common';

import { Body, createSchemaPipe, Put } from './decorators';
import NoteService from 'service/NoteService';
import type { NoteVO } from 'interface/Note';
import { entitiesDTOSchema, type EntitiesDTO } from 'interface/Recyclables';

@Controller()
export default class RecyclablesController {
  constructor(private noteService: NoteService) {}

  @Put('/recyclables/notes')
  async create(@Body(createSchemaPipe(entitiesDTOSchema)) { ids }: EntitiesDTO): Promise<void> {
    // return await this.noteService.deleteNotes(ids);
  }
}
