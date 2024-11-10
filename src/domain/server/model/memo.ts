import type { Entity } from '@domain/shared/model/entity.js';

export * from '@domain/shared/model/memo.js';

export function normalizeTitle(memo: Entity) {
  return `memo-${memo.createdAt}`;
}
