import type { MemoVO } from 'shard/model/memo';

type Memo = Pick<MemoVO, 'id' | 'content' | 'createdAt'>;

export * from 'shard/model/memo';

export interface MemoQuery {
  id?: Memo['id'][];
  updatedAt?: number;
}
