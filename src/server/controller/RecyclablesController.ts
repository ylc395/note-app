import { Controller } from '@nestjs/common';

import RecyclableService from 'service/RecyclableService';
import { RecyclablesDTOSchema, type RecyclableVO, type RecyclablesDTO } from 'model/recyclables';

import { Body, createSchemaPipe, Get, Patch } from './decorators';

@Controller()
export default class RecyclablesController {
  constructor(private recyclableService: RecyclableService) {}

  @Patch('/recyclables')
  async create(@Body(createSchemaPipe(RecyclablesDTOSchema)) entities: RecyclablesDTO): Promise<void> {
    return await this.recyclableService.create(entities);
  }

  @Get('/recyclables')
  async queryItems(): Promise<RecyclableVO[]> {
    return await this.recyclableService.query();
  }
}
