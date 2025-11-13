import container from '#utils/singletonContainer.js';
import { SearchFields, type SearchRequest, type SearchResultVO } from '#domain/shared/model/search.js';
import { EntityTypes } from '#domain/shared/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class SearchService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  public async search(q: SearchRequest): Promise<SearchResultVO[]> {
    if (!q.keyword) {
      return [];
    }

    const entityTypes = q.entityTypes || [EntityTypes.Note, EntityTypes.Memo];
    const fields = q.fields || [SearchFields.Title, SearchFields.Body, SearchFields.File, SearchFields.Annotation];
    const rootId = q.rootId || [];

    const results = await this.searchEngine.search({ ...q, entityTypes, fields, rootId });
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
