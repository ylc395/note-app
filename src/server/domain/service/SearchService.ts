import { Inject, Injectable } from '@nestjs/common';
import {
  parse,
  type ExpressionNode,
  type ValueNode,
  type KeyValueNode,
  ExpressionNodeType,
} from 'search-expression-parser';

import { type SearchEngine, token as searchEngineToken, type SearchQuery } from 'infra/searchEngine';
import { EntityTypes } from 'interface/entity';
import BaseService from './BaseService';

@Injectable()
export default class SearchService extends BaseService {
  @Inject(searchEngineToken) private readonly searchEngine!: SearchEngine;

  async search(keyword: string) {
    const query = SearchService.parseKeyword(keyword);
    await this.searchEngine.search(query);
  }

  private static parseKeyword(keyword: string) {
    keyword = keyword
      .replace(/\bAND\b/i, '"AND"')
      .replace(/\bOR\b/i, '"OR"')
      .replace(/\bNOT\b/i, '"NOT"');

    const parsed = parse(keyword);

    const result: SearchQuery = {
      title: [],
      content: [],
      all: [],
      type: [],
    };

    if (!parsed.success) {
      return result;
    }

    const words: (ValueNode | KeyValueNode)[] = [];

    function traverse(node: ExpressionNode) {
      if (node.type === ExpressionNodeType.KeyValue || node.type === ExpressionNodeType.Value) {
        words.push(node);
      } else if (node.type === ExpressionNodeType.And) {
        traverse(node.leftChild);
        traverse(node.rightChild);
      }
    }

    traverse(parsed.data);

    let field: keyof SearchQuery | 'invalid' = 'all';

    for (const word of words) {
      if (word.type === ExpressionNodeType.KeyValue) {
        const key = word.key.content.toLowerCase();

        if (SearchService.isValidKey(key)) {
          field = key;
        } else {
          field = 'invalid';
          continue;
        }
      }

      if (field === 'invalid') {
        continue;
      } else {
        const value = word.value.content;

        if (field === 'type') {
          const typeValue = SearchService.fromEntityTypeString(value);

          if (typeValue) {
            result.type.push(typeValue);
          }
        } else if (value) {
          result[field].push(value);
        }
      }
    }

    return result;
  }

  private static isValidKey(key: string): key is keyof SearchQuery {
    return ['title', 'type', 'content'].includes(key);
  }

  private static fromEntityTypeString(str: string): EntityTypes | null {
    switch (str) {
      case 'note':
        return EntityTypes.Note;
      case 'memo':
        return EntityTypes.Memo;
      case 'material':
        return EntityTypes.Material;
      default:
        return null;
    }
  }
}
