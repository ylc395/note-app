import type { MemoVO } from '#domain/shared/model/memo';

export interface MemoItem extends MemoVO {
  justCreated?: 'keep' | 'omit'; // omit：根据当前的过滤条件，该新创建的 memo 不应该出现在列表中
}
