import { Controller, UsePipes } from '@nestjs/common';

import { type TagDTO, type TagQuery, type TagVO, tagSchema } from 'interface/Tag';
import TagService from 'service/TagService';

import { Post, Get, Body, Query, createPipe } from './decorators';

@Controller()
export default class TagsController {
  constructor(private tagService: TagService) {}

  @Post('tags')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @UsePipes(createPipe(tagSchema as any))
  async create(@Body() tag: TagDTO): Promise<TagVO> {
    return await this.tagService.create(tag);
  }

  @Get('tags')
  async findAll(@Query() query: TagQuery) {
    return await this.tagService.findAll(query);
  }
}
