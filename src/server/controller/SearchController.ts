import { Controller, Inject } from '@nestjs/common';

import { type SearchResult, type SearchQuery, searchQuerySchema } from 'model/search';
import { token as searchEngineToken, type SearchEngine } from 'infra/searchEngine';
import { Post, Body, createSchemaPipe } from './decorators';

@Controller()
export default class SyncController {
  constructor(@Inject(searchEngineToken) private searchEngine: SearchEngine) {}

  @Post('/search')
  async search(@Body(createSchemaPipe(searchQuerySchema)) q: SearchQuery): Promise<SearchResult[]> {
    return this.searchEngine.search(q);
  }
}
