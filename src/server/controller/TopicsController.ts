import { Controller } from '@nestjs/common';

import { TopicQuerySchema, type TopicQuery, type TopicVO } from 'interface/Topic';
import StarService from 'service/StarService';
import { Get, createSchemaPipe, Query } from './decorators';

@Controller()
export default class TopicsController {
  constructor(private starService: StarService) {}

  @Get('/topics')
  async queryAll(@Query(createSchemaPipe(TopicQuerySchema)) query: TopicQuery): Promise<TopicVO[]> {
    return [];
  }
}
