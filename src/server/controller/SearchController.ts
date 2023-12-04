import { Controller } from '@nestjs/common';

import { type SearchResultVO, type SearchParams, searchParamsSchema } from '@domain/model/search';
import SearchService from '@domain/service/SearchService';

import { Post, Body, createSchemaPipe } from './decorators';

@Controller()
export default class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('/search')
  async search(@Body(createSchemaPipe(searchParamsSchema)) q: SearchParams): Promise<SearchResultVO[]> {
    return this.searchService.search(q);
  }
}
