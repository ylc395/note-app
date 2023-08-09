import type { MemoVO } from 'shard/model/memo';

type Memo = Pick<MemoVO, 'content' | 'createdAt'>;

export function digest(memo: Memo) {
  return memo.content.slice(0, 10);
}

export * from 'shard/model/memo';

export interface MemoQuery {
  id?: MemoVO['id'] | MemoVO['id'][];
  updatedAt?: number;
}
