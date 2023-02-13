import { Controller } from '@nestjs/common';

import { EntityTypes } from 'interface/Entity';
import { type StarsDTO, starsDTOSchema, StarRecord } from 'interface/Star';
import StarService from 'service/StarService';
import { Get, Put, Body, createSchemaPipe } from './decorators';

@Controller()
export default class StarsController {
  constructor(private starService: StarService) {}

  @Put('/stars/notes')
  async create(@Body(createSchemaPipe(starsDTOSchema)) { ids }: StarsDTO): Promise<StarRecord[]> {
    return this.starService.put(EntityTypes.Note, ids);
  }

  @Get('/stars')
  async queryAll(): Promise<Required<StarRecord>[]> {
    return this.starService.query();
  }
}
