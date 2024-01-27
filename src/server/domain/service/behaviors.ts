import { groupBy, mapValues } from 'lodash-es';

import type { EntityId, HierarchyEntity } from '@domain/model/entity.js';
import type { NoteRepository } from './repository/NoteRepository.js';
import type { MaterialRepository } from './repository/MaterialRepository.js';
import { Note } from '@domain/model/note.js';
import { Material } from '@domain/model/material.js';
import { buildIndex } from '@utils/collection.js';

type Repo = NoteRepository | MaterialRepository;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TitleNormalizer = (v: any) => string;

export async function getPaths({
  ids,
  repo,
  normalizeTitle,
}: {
  ids: EntityId[];
  repo: Repo;
  normalizeTitle: TitleNormalizer;
}) {
  const ancestorIds = await repo.findAncestorIds(ids);
  const entities = buildIndex<Note | Material>(await repo.findAll({ id: Object.values(ancestorIds).flat() }));
  const titles = mapValues(ancestorIds, (ids) =>
    ids.map((id) => ({ id, title: normalizeTitle(entities[id]!), icon: entities[id]!.icon })),
  );

  return titles;
}

export async function getTreeFragment(repo: Repo, id: EntityId) {
  const ancestorIds = (await repo.findAncestorIds([id]))[id] || [];
  const childrenIds = Object.values(await repo.findChildrenIds(ancestorIds, true)).flat();
  const roots = await repo.findAll({ parentId: null, isAvailable: true });
  const children = await repo.findAll({ id: childrenIds, isAvailable: true });
  const childrenMap = groupBy(children as HierarchyEntity[], 'parentId');

  const result: HierarchyEntity[] = [...roots];

  let i = 0;
  while (result[i]) {
    result.push(...(childrenMap[result[i]!.id] || []));
    i += 1;
  }

  return result;
}
