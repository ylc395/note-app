import { groupBy, mapValues } from 'lodash-es';

import type { EntityId, HierarchyEntity } from '@domain/model/entity.js';
import type { Note } from '@domain/model/note.js';
import type { Material } from '@domain/model/material.js';
import type { NoteRepository } from '../repository/NoteRepository.js';
import type { MaterialRepository } from '../repository/MaterialRepository.js';
import { buildIndex } from '@utils/collection.js';

export default class HierarchyBehavior {
  constructor(private readonly repo: NoteRepository | MaterialRepository) {}

  public async getTreeFragment(id: EntityId) {
    const ancestorIds = (await this.repo.findAncestorIds([id]))[id] || [];
    const childrenIds = Object.values(await this.repo.findChildrenIds(ancestorIds, { isAvailableOnly: true })).flat();
    const roots = await this.repo.findAll({ parentId: null, isAvailable: true });
    const children = await this.repo.findAll({ id: childrenIds, isAvailable: true });
    const childrenMap = groupBy(children as HierarchyEntity[], 'parentId');

    const result: HierarchyEntity[] = [...roots];

    let i = 0;
    while (result[i]) {
      result.push(...(childrenMap[result[i]!.id] || []));
      i += 1;
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getPaths(ids: EntityId[], normalizeTitle: (entity: any) => string) {
    const ancestorIds = await this.repo.findAncestorIds(ids);
    const entities = buildIndex<Note | Material>(await this.repo.findAll({ id: Object.values(ancestorIds).flat() }));
    const titles = mapValues(ancestorIds, (ids) =>
      ids.map((id) => ({ id, title: normalizeTitle(entities[id]!), icon: entities[id]!.icon })),
    );

    return titles;
  }
}
