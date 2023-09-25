import { Inject, Injectable } from '@nestjs/common';

import { token as searchEngineToken, type SearchEngine } from 'infra/searchEngine';
import type { SearchParams } from 'model/search';
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
    const results = await this.searchEngine.search(q);
    const paths = await this.entityService.getPath(results);
    const stars = await this.starService.getStarMap(results);
    return results.map((result) => ({
      ...result,
      isStar: Boolean(stars[result.entityId]),
      path:
        result.entityType === EntityTypes.Note || result.entityType === EntityTypes.Material
          ? `/${paths[result.entityType][result.entityId]!.join('/')}`
          : '',
    }));
  }
}
