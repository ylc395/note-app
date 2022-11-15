import { Controller, ParseBoolPipe, ParseIntPipe } from '@nestjs/common';
import {
  type TagDTO,
  type TagQuery,
  type TagVO,
  type TagPatchDTO,
  tagDTOSchema,
  tagPatchDTOSchema,
} from 'interface/Tag';
import TagService from 'service/TagService';

import { Post, Get, Delete, Patch, Body, Query, Headers, Param, createSchemaPipe } from './decorators';

@Controller()
export default class TagsController {
  constructor(private tagService: TagService) {}

  @Post('/tags')
  async create(@Body(createSchemaPipe(tagDTOSchema)) tag: TagDTO): Promise<TagVO> {
    return await this.tagService.create(tag);
  }

  @Get('/tags')
  async findAll(@Query() query: TagQuery): Promise<TagVO[]> {
    return await this.tagService.findAll(query || {});
  }

  @Delete('/tags/:id')
  async delete(
    @Param('id', ParseIntPipe) tagId: TagVO['id'],
    @Headers('cascade', ParseBoolPipe)
    cascade: boolean,
  ): Promise<void> {
    return await this.tagService.deleteOne(tagId, cascade);
  }

  @Patch('/tags/:id')
  async update(
    @Param('id', ParseIntPipe) id: TagVO['id'],
    @Body(createSchemaPipe(tagPatchDTOSchema)) tagPatch: TagPatchDTO,
  ): Promise<void> {
    return await this.tagService.update(id, tagPatch);
  }
}
