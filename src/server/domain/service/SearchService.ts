import { token as searchEngineToken } from '@domain/infra/searchEngine.js';
import type { SearchParams, SearchResultVO } from '@domain/model/search.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';
import { container } from 'tsyringe';

export default class SearchService extends BaseService {
  private readonly searchEngine = container.resolve(searchEngineToken);
  private readonly entityService = container.resolve(EntityService);

  public async search(q: SearchParams): Promise<SearchResultVO[]> {
    const results = await this.searchEngine.search(q);
    const paths = await this.entityService.getPaths(EntityService.toIds(results));

    return results.map((result) => ({
      ...result,
      path: paths[result.entityId]!,
    }));
  }
}
