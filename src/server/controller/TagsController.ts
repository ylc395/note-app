import { Controller, ParseBoolPipe, ParseIntPipe } from '@nestjs/common';
import { type TagDTO, type TagQuery, type TagVO, tagDTOSchema } from 'interface/Tag';
import TagService from 'service/TagService';

import { Post, Get, Delete, Body, Query, Headers, Param, createSchemaPipe } from './decorators';

@Controller()
export default class TagsController {
  constructor(private tagService: TagService) {}

  @Post('tags')
  async create(@Body(createSchemaPipe(tagDTOSchema)) tag: TagDTO): Promise<TagVO> {
    return await this.tagService.create(tag);
  }

  @Get('tags')
  async findAll(@Query() query: TagQuery): Promise<TagVO[]> {
    return await this.tagService.findAll(query || {});
  }

  @Delete('tags/:id')
  async delete(
    @Param('id', ParseIntPipe) tagId: TagVO['id'],
    @Headers('cascade', ParseBoolPipe)
    cascade: boolean,
  ): Promise<void> {
    return await this.tagService.deleteOne(tagId, cascade);
  }
}
