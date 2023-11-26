import { singleton, container } from 'tsyringe';
// import {
//   parse,
//   type ExpressionNode,
//   type ValueNode,
//   type KeyValueNode,
//   ExpressionNodeType,
// } from 'search-expression-parser';

import type { SearchParams, SearchResult, SearchTreeParams } from 'model/search';
import { token as remoteToken } from 'infra/remote';

@singleton()
export default class SearchService {
  private readonly remote = container.resolve(remoteToken);

  readonly search = async (q: SearchParams) => {
    await this.remote.post<SearchParams, SearchResult[]>('/search', q);
  };

  readonly searchTree = (q: SearchTreeParams) => {
    this.remote.post<SearchTreeParams, SearchResult[]>('/search/tree', q);
  };

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
