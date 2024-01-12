import { singleton, container } from 'tsyringe';
import assert from 'assert';
// import {
//   parse,
//   type ExpressionNode,
//   type ValueNode,
//   type KeyValueNode,
//   ExpressionNodeType,
// } from 'search-expression-parser';

import { Scopes, type SearchParams, type SearchResult, type SearchableEntityType } from '@shared/domain/model/search';
import { token as remoteToken } from '@domain/common/infra/rpc';
import { EntityTypes } from '@domain/app/model/entity';

@singleton()
export default class SearchService {
  private readonly remote = container.resolve(remoteToken);

  readonly search = async (q: SearchParams) => {
    // return this.remote.post<SearchParams, SearchResult[]>('/search', q);
  };

  readonly searchInTree = async (q: { keyword: string; containBody: boolean; type: SearchableEntityType }) => {
    if (!q.keyword) {
      return;
    }

    const result = await this.search({
      keyword: q.keyword,
      scopes: SearchService.getScopes(q.type, q.containBody),
    });
  };

  private static getScopes(type: SearchableEntityType, containBody: boolean) {
    if (type === EntityTypes.Note) {
      return [Scopes.NoteTitle, ...(containBody ? [Scopes.NoteBody, Scopes.NoteFile] : [])];
    }

    assert.fail('invalid type');
  }

  // private static parseKeyword(q: string): SearchQuery | null {
  //   // we won't support AND / OR / NOT operators. so convert them into common content
  //   q = q
  //     .replaceAll(/\bAND\b/gi, '"AND"')
  //     .replaceAll(/\bOR\b/gi, '"OR"')
  //     .replaceAll(/\bNOT\b/gi, '"NOT"');

  //   const parsed = parse(q);

  //   if (!parsed.success) {
  //     return null;
  //   }

  //   const words: (ValueNode | KeyValueNode)[] = [];
  //   const query: SearchQuery = { terms: [] };

  //   function traverse(node: ExpressionNode) {
  //     if (node.type === ExpressionNodeType.KeyValue || node.type === ExpressionNodeType.Value) {
  //       words.push(node);
  //     } else if (node.type === ExpressionNodeType.And) {
  //       traverse(node.leftChild);
  //       traverse(node.rightChild);
  //     }
  //   }

  //   traverse(parsed.data);

  //   for (const word of words) {
  //     if (word.type === ExpressionNodeType.Value) {
  //       query.terms.push(word.value.content);
  //     }

  //     if (word.type === ExpressionNodeType.KeyValue) {
  //       const key = word.key.content;

  //       if (!isValidQueryKey(key)) {
  //         continue;
  //       }

  //       const values = word.value.content.split(/\s+/).filter((v) => isValidQueryValue(key, v));
  //     }

  //     return query;
  //   }
  // }
}
