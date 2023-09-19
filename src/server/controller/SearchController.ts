import { Controller, Inject } from '@nestjs/common';

import { type SearchResult, type SearchParams, searchParamsSchema } from 'model/search';
import { token as searchEngineToken, type SearchEngine } from 'infra/searchEngine';
import { Post, Body, createSchemaPipe } from './decorators';

@Controller()
export default class SyncController {
  constructor(@Inject(searchEngineToken) private searchEngine: SearchEngine) {}

  @Post('/search')
  async search(@Body(createSchemaPipe(searchParamsSchema)) q: SearchParams): Promise<SearchResult[]> {
    return this.searchEngine.search(q);
  }
}
