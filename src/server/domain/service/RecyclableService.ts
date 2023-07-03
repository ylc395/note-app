import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';

import { type EntityLocator, EntityTypes, EntityId } from 'interface/entity';
import { token as searchEngineToken, type SearchEngine } from 'infra/searchEngine';
import BaseService from './BaseService';
import NoteService from './NoteService';
import MaterialService from './MaterialService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;
  @Inject(forwardRef(() => MaterialService)) private readonly materialService!: MaterialService;
  @Inject(searchEngineToken) private readonly searchEngine!: SearchEngine;

  async create(entities: EntityLocator[]) {
    const groups = groupBy(entities, 'type');

    for (const [type, entitiesOfType] of Object.entries(groups)) {
      const ids = entitiesOfType.map(({ id }) => id);

      switch (Number(type)) {
        case EntityTypes.Note:
          await this.prepareNotes(ids);
          break;

        default:
          break;
      }
    }

    return await this.recyclables.create(entities);
  }

  private async prepareNotes(ids: EntityId[]) {
    const allIds = [...ids, ...(await this.notes.findAllDescendantIds(ids))];
    const areAvailable = await this.noteService.areAvailable(allIds);

    if (!areAvailable) {
      throw new Error('entities not available');
    }

    await this.searchEngine.remove(ids.map((id) => ({ id, type: EntityTypes.Note })));
  }

  async areRecyclables(entities: EntityLocator[]) {
    return (await this.recyclables.findAllByLocators(entities)).length > 0;
  }
}
