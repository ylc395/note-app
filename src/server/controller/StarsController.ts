import { Controller } from '@nestjs/common';

import { stringToEntityTypes } from 'interface/Entity';
import { type StarsDTO, starsDTOSchema, StarRecord } from 'interface/Star';
import StarService from 'service/StarService';
import { Get, Put, Body, createSchemaPipe, Delete, Param } from './decorators';

@Controller()
export default class StarsController {
  constructor(private starService: StarService) {}

  @Put('/stars/:entityType')
  async create(
    @Body(createSchemaPipe(starsDTOSchema)) { ids }: StarsDTO,
    @Param('entityType') entityType: string,
  ): Promise<StarRecord[]> {
    const type = stringToEntityTypes[entityType];

    if (!type) {
      throw new Error('wrong type');
    }

    return this.starService.create(type, ids);
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
