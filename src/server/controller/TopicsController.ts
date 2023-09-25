import { Controller } from '@nestjs/common';

import { type TopicQuery, type TopicVO, topicQuerySchema, TopicDTO } from 'model/content';
import ContentService from 'service/ContentService';

import { Get, createSchemaPipe, Query, Patch, Body, EnableOnly } from './decorators';

@Controller()
export default class TopicsController {
  constructor(private contentService: ContentService) {}

  @Get('/topics/names')
  async queryTopicNames(): Promise<string[]> {
    return await this.contentService.queryTopicNames();
  }

  @Get('/topics')
  async queryTopics(@Query(createSchemaPipe(topicQuerySchema)) q: TopicQuery): Promise<TopicVO[]> {
    return await this.contentService.queryTopics(q);
  }

  @EnableOnly('ipc')
  @Patch('/topics')
  async createTopics(@Body() topics: TopicDTO[]): Promise<void> {
    return await this.contentService.createTopics(topics);
  }
}
