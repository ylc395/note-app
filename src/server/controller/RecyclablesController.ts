import { Controller } from '@nestjs/common';

import RecyclableService from 'service/RecyclableService';
import { RecyclablesDTOSchema, type RecyclableVO, type RecyclablesDTO } from 'model/recyclables';

import { Body, createSchemaPipe, Delete, Get, Patch, Query } from './decorators';
import type { EntityLocator } from 'model/entity';

@Controller()
export default class RecyclablesController {
  constructor(private recyclableService: RecyclableService) {}

  @Patch('/recyclables')
  async create(@Body(createSchemaPipe(RecyclablesDTOSchema)) entities: RecyclablesDTO): Promise<void> {
    return await this.recyclableService.create(entities);
  }

  @Delete('/recyclables')
  async remove(@Query(createSchemaPipe(RecyclablesDTOSchema)) entity: EntityLocator): Promise<void> {
    return await this.recyclableService.remove(entity);
  }

  @Get('/recyclables')
  async queryItems(): Promise<RecyclableVO[]> {
    return await this.recyclableService.query();
  }
}
