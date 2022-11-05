import { Controller, UsePipes } from '@nestjs/common';

import { type TagDTO, type TagQuery, type TagVO, tagDTOSchema } from 'interface/Tag';
import TagService from 'service/TagService';

import { Post, Get, Body, Query, createPipe } from './decorators';

@Controller()
export default class TagsController {
  constructor(private tagService: TagService) {}

  @Post('tags')
  @UsePipes(createPipe(tagDTOSchema))
  async create(@Body() tag: TagDTO): Promise<TagVO> {
    return await this.tagService.create(tag);
  }

  @Get('tags')
  async findAll(@Query() query: TagQuery) {
    return await this.tagService.findAll(query);
  }
}
