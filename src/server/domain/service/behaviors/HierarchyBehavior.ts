import { mapValues } from 'lodash-es';

import type { EntityId } from '@domain/model/entity.js';
import type { NoteRepository } from '../repository/NoteRepository.js';
import type { MaterialRepository } from '../repository/MaterialRepository.js';
import { buildIndex } from '@utils/collection.js';
import BaseService from '../BaseService.js';

export default class HierarchyBehavior extends BaseService {
  constructor(private readonly domainRepo: NoteRepository | MaterialRepository) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getPaths(ids: EntityId[], normalizeTitle: (entity: any) => string) {
    const ancestorIds = await this.repo.entities.findAncestorIds(ids);
    const entities = buildIndex(await this.domainRepo.findAll({ id: Object.values(ancestorIds).flat() }));
    const titles = mapValues(ancestorIds, (ids) =>
      ids.map((id) => ({ id, title: normalizeTitle(entities[id]!), icon: entities[id]!.icon })),
    );

    return titles;
  }
}
