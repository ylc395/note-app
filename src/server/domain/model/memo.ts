import type { MemoVO } from 'shard/model/memo';

type Memo = Pick<MemoVO, 'id' | 'content' | 'createdAt'>;

export function digest(memo: Memo) {
  return memo.content.slice(0, 10);
}

export * from 'shard/model/memo';

export interface MemoQuery {
  id?: Memo['id'][];
  updatedAt?: number;
}
