import { Controller } from '@nestjs/common';

import RecyclableService from 'service/RecyclableService';
import { RecyclablesDTOSchema, type RecyclableRecord, type RecyclablesDTO } from 'interface/recyclables';

import { Body, createSchemaPipe, Get, Patch } from './decorators';

@Controller()
export default class RecyclablesController {
  constructor(private recyclableService: RecyclableService) {}

  @Patch('/recyclables')
  async create(@Body(createSchemaPipe(RecyclablesDTOSchema)) entities: RecyclablesDTO): Promise<RecyclableRecord[]> {
    return await this.recyclableService.create(entities);
  }

  @Get('/recyclables')
  async queryItems(): Promise<RecyclableRecord[]> {}
}
