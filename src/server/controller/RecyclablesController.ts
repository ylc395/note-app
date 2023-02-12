import { Controller } from '@nestjs/common';

import { EntityTypes } from 'model/Entity';
import RecyclableService from 'service/RecyclableService';
import { RecyclablesDTOSchema, RecyclablesRecord, type RecyclablesDTO } from 'interface/Recyclables';

import { Body, createSchemaPipe, Put } from './decorators';

@Controller()
export default class RecyclablesController {
  constructor(private recyclableService: RecyclableService) {}

  @Put('/recyclables/notes')
  async create(@Body(createSchemaPipe(RecyclablesDTOSchema)) { ids }: RecyclablesDTO): Promise<RecyclablesRecord> {
    return await this.recyclableService.put(EntityTypes.Note, ids);
  }
}
