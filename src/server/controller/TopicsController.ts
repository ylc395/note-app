import { Controller } from '@nestjs/common';

import { type TopicVO, type TopicDTO, topicsDTOSchema } from '@domain/model/content.js';
import ContentService from '@domain/service/ContentService.js';

import { Get, Patch, Body, createSchemaPipe, Param, EnableOnly } from './decorators.js';

@Controller()
export default class TopicsController {
  constructor(private contentService: ContentService) {}

  @Get('/topics/names')
  async queryTopicNames(): Promise<string[]> {
    return await this.contentService.queryTopicNames();
  }

  @Get('/topics/:name')
  async queryTopics(@Param('name') name: string): Promise<TopicVO[]> {
    return await this.contentService.queryTopics({ name });
  }

  @EnableOnly('ipc')
  @Patch('/topics')
  async createTopics(@Body(createSchemaPipe(topicsDTOSchema)) topics: TopicDTO[]): Promise<void> {
    return await this.contentService.createTopics(topics);
  }
}
