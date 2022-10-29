import { Controller } from '@nestjs/common';

import type { TagDTO, TagQuery, TagVO } from 'interface/Tag';
import TagService from 'service/TagService';

import { Post, Get, Body, Query } from './decorators';

@Controller()
export default class TagsController {
  constructor(private tagService: TagService) {}

  @Post('tags')
  async create(@Body() tag: TagDTO): Promise<TagVO> {
    return await this.tagService.create(tag);
  }

  @Get('tags')
  async getAll(@Query() { type }: TagQuery) {
    return await this.tagService.getAll(type);
  }
}
