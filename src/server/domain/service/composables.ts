import type { EntityId } from '@domain/model/entity.js';
import type { NoteRepository } from './repository/NoteRepository.js';
import type { MaterialRepository } from './repository/MaterialRepository.js';
import { Note } from '@domain/model/note.js';
import { Material } from '@domain/model/material.js';
import { mapValues } from 'lodash-es';
import { buildIndex } from '@utils/collection.js';

type Repo = NoteRepository | MaterialRepository;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TitleNormalizer = (v: any) => string;

export async function getNormalizedTitles({
  repo,
  ids,
  normalizeTitle,
}: {
  ids: EntityId[];
  repo: Repo;
  normalizeTitle: TitleNormalizer;
}) {
  const entities = buildIndex<Note | Material>(await repo.findAll({ id: ids }));
  return mapValues(entities, normalizeTitle);
}

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
