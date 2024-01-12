import { token as searchEngineToken } from '@domain/infra/searchEngine.js';
import type { SearchParams, SearchResultVO } from '@domain/model/search.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import StarService from './StarService.js';
import { container } from 'tsyringe';

export default class SearchService extends BaseService {
  private readonly searchEngine = container.resolve(searchEngineToken);
  private readonly entityService = container.resolve(EntityService);
  private readonly starService = container.resolve(StarService);

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
