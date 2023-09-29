import { Controller } from '@nestjs/common';

import {
  type TopicVO,
  type TopicDTO,
  type InlineTopicDTO,
  topicsDTOSchema,
  inlineTopicsDTOSchema,
} from 'model/content';
import ContentService from 'service/ContentService';

import { Get, Patch, Body, createSchemaPipe, Param, EnableOnly } from './decorators';

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

  @Patch('/topics')
  async createTopics(@Body(createSchemaPipe(topicsDTOSchema)) topics: TopicDTO[]): Promise<void> {
    return await this.contentService.createTopics(topics);
  }

  @EnableOnly('ipc')
  @Patch('/topics/inline')
  async createInlineTopics(@Body(createSchemaPipe(inlineTopicsDTOSchema)) topics: InlineTopicDTO[]): Promise<void> {
    return await this.contentService.createTopics(topics);
  }
}
