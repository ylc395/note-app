import { Controller } from '@nestjs/common';

import { Body, createSchemaPipe, Put } from './decorators';
import RecyclableService, { RecyclablesTypes } from 'service/RecyclableService';
import { entitiesDTOSchema, RecycleRecord, type RecyclableEntitiesDTO } from 'interface/Recyclables';

@Controller()
export default class RecyclablesController {
  constructor(private recyclableService: RecyclableService) {}

  @Put('/recyclables/notes')
  async create(@Body(createSchemaPipe(entitiesDTOSchema)) { ids }: RecyclableEntitiesDTO): Promise<RecycleRecord> {
    return await this.recyclableService.put(RecyclablesTypes.Note, ids);
  }
}
