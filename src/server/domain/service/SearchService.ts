import { Inject, Injectable } from '@nestjs/common';

import { token as searchEngineToken, type SearchEngine } from 'infra/searchEngine';
import type { MaterialAnnotationSearchResult, SearchParams, SearchResult } from 'model/search';
import { EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import EntityService from './EntityService';
import StarService from './StarService';

@Injectable()
export default class SearchService extends BaseService {
  @Inject(searchEngineToken) private readonly searchEngine!: SearchEngine;
  @Inject() private readonly entityService!: EntityService;
  @Inject() private readonly starService!: StarService;

  async search(q: SearchParams) {
    const isAnnotation = (result: SearchResult): result is MaterialAnnotationSearchResult =>
      result.entityType === EntityTypes.MaterialAnnotation;

    const results = await this.searchEngine.search(q);
    const parentMaterials = results
      .filter(isAnnotation)
      .map(({ mainEntityId }) => ({ entityType: EntityTypes.Material, entityId: mainEntityId }));

    const paths = await this.entityService.getPath([...results, ...parentMaterials]);
    const stars = await this.starService.getStarMap(results);

    return results.map((result) => ({
      ...result,
      isStar: Boolean(stars[result.entityId]),
      path:
        result.entityType === EntityTypes.MaterialAnnotation
          ? paths[EntityTypes.Material][result.mainEntityId]!
          : paths[result.entityType][result.entityId]!,
    }));
  }
}
