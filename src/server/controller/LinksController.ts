import { Controller } from '@nestjs/common';

import { type LinkToVO, linksDTOSchema, type LinkDTO, type LinkToQuery } from 'model/content';
import ContentService from 'service/ContentService';

import { Get, Patch, Body, EnableOnly, createSchemaPipe, Query } from './decorators';

@Controller()
export default class LinksController {
  constructor(private contentService: ContentService) {}

  @Get('/links/to')
  async queryLinkTos(@Query() q: LinkToQuery): Promise<LinkToVO[]> {
    return await this.contentService.queryLinkTos(q);
  }

  @EnableOnly('ipc')
  @Patch('/links')
  async createLinks(@Body(createSchemaPipe(linksDTOSchema)) topics: LinkDTO[]): Promise<void> {
    return await this.contentService.createLinks(topics);
  }
}
