import container from '#utils/singletonContainer.js';
import type { SearchRequest, SearchResultVO } from '#domain/shared/model/search.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class SearchService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  public async search(q: SearchRequest): Promise<SearchResultVO[]> {
    if (!q.keyword) {
      return [];
    }

    const results = await this.searchEngine.search(q);

    const ids = results.map(({ entityId: id }) => id);
    const paths = await this.entityService.getPaths(ids);
    const entities = await this.entityService.getEntities(ids);

    return results.map((result) => ({
      ...entities[result.entityId]!,
      matches: result.matches,
      path: paths[result.entityId]!,
    }));
  }
}
