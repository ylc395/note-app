import { Controller } from '@nestjs/common';

import RecyclableService from 'service/RecyclableService';
import {
  type RecyclableVO,
  type RecyclablesDTO,
  type RecyclableDTO,
  recyclableDTOSchema,
  recyclablesDTOSchema,
} from 'model/recyclables';

import { Body, createSchemaPipe, Delete, Get, Patch, Query } from './decorators';

@Controller()
export default class RecyclablesController {
  constructor(private recyclableService: RecyclableService) {}

  @Patch('/recyclables')
  async create(@Body(createSchemaPipe(recyclablesDTOSchema)) entities: RecyclablesDTO): Promise<void> {
    return await this.recyclableService.create(entities);
  }

  @Delete('/recyclables')
  async remove(@Query(createSchemaPipe(recyclableDTOSchema)) entity: RecyclableDTO): Promise<void> {
    return await this.recyclableService.remove(entity);
  }

  @Get('/recyclables')
  async queryItems(): Promise<RecyclableVO[]> {
    return await this.recyclableService.query();
  }
}
