import { Controller } from '@nestjs/common';

import { type StarsDTO, starsDTOSchema, StarRecord } from 'model/star';
import StarService from 'service/StarService';
import { Get, Body, createSchemaPipe, Delete, Param, Patch } from './decorators';

@Controller()
export default class StarsController {
  constructor(private starService: StarService) {}

  @Patch('/stars')
  async create(@Body(createSchemaPipe(starsDTOSchema)) entities: StarsDTO): Promise<StarRecord[]> {
    return this.starService.create(entities);
  }

  @Get('/stars')
  async queryAll(): Promise<Required<StarRecord>[]> {
    return this.starService.query();
  }

  @Delete('/stars/:id')
  async deleteStar(@Param('id') id: string): Promise<void> {
    return this.starService.remove(id);
  }
}
