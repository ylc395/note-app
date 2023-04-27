import { Injectable, Inject } from '@nestjs/common';

import { EntityId, EntityTypes } from 'interface/entity';
import BaseService from './BaseService';
import NoteService from './NoteService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject() private readonly noteService!: NoteService;

  async putNotes(ids: EntityId[]) {
    const allIds = [...ids, ...(await this.notes.findAllDescendantIds(ids))];
    const areAvailable = await this.noteService.areAvailable(allIds);

    if (!areAvailable) {
      throw new Error('entities not available');
    }

    return await this.recyclables.put(EntityTypes.Note, allIds);
  }
}
