import { Inject, Injectable } from '@nestjs/common';

import { token as searchEngineToken, type SearchEngine } from '@domain/infra/searchEngine.js';
import type { SearchParams, SearchResultVO } from '@domain/model/search.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import StarService from './StarService.js';

@Injectable()
export default class SearchService extends BaseService {
  @Inject(searchEngineToken) private readonly searchEngine!: SearchEngine;
  @Inject() private readonly entityService!: EntityService;
  @Inject() private readonly starService!: StarService;

  async search(q: SearchParams): Promise<SearchResultVO[]> {
    // await this.assertSearchParams(q);

    const results = await this.searchEngine.search(q);
    const paths = await this.entityService.getPaths(results);
    const stars = await this.starService.getStarMap(EntityService.toIds(results));

    return results.map((result) => ({
      ...result,
      isStar: Boolean(stars[result.entityId]),
      path: paths[result.entityId]!,
    }));
  }

  // private async assertSearchParams(q: SearchParams) {}
}
