import { Injectable, Inject, forwardRef } from '@nestjs/common';
import zipObject from 'lodash/zipObject';

import { EntityId, EntityLocator, EntityTypes } from 'interface/entity';
import { buildIndex } from 'utils/collection';
import BaseService from './BaseService';
import NoteService from './NoteService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;

  async putNotes(ids: EntityId[]) {
    const allIds = [...ids, ...(await this.notes.findAllDescendantIds(ids))];
    const areAvailable = await this.noteService.areAvailable(allIds);

    if (!areAvailable) {
      throw new Error('entities not available');
    }

    return await this.recyclables.put(EntityTypes.Note, allIds);
  }

  async isRecyclable(entity: EntityLocator) {
    return Boolean(await this.recyclables.findOneByLocator(entity));
  }

  async areRecyclables(type: EntityTypes, ids: EntityId[]) {
    const rows = await this.recyclables.findAllByLocator(type, ids);
    const index = buildIndex(rows, 'entityId');

    return zipObject(
      ids,
      ids.map((id) => Boolean(index[id])),
    );
  }
}
