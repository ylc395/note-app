import { Inject, Injectable } from '@nestjs/common';
import { parse } from 'search-expression-parser';

import { type SearchEngine, token as searchEngineToken } from 'infra/SearchEngine';
import BaseService from './BaseService';

@Injectable()
export default class SearchService extends BaseService {
  @Inject(searchEngineToken) private readonly searchEngine!: SearchEngine;
  search(keyword: string) {
    const parsed = parse(keyword);

    if (!parsed.success) {
      throw new Error('invalid search keyword');
    }
  }
}
