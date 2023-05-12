import { Controller } from '@nestjs/common';

import SearchService from 'service/SearchService';
import { Get, Query, createSchemaPipe } from './decorators';
import { type SearchQuery, searchQuerySchema } from 'interface/search';

@Controller()
export default class SyncController {
  constructor(private searchService: SearchService) {}

  @Get('/search')
  async search(@Query(createSchemaPipe(searchQuerySchema)) { q }: SearchQuery): Promise<unknown> {
    return this.searchService.search(q);
  }
}
