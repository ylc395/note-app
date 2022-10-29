import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as materialRepositoryToken, type MaterialRepository } from 'service/repository/MaterialRepository';
import type { MaterialDTO } from 'dto/Material';
import { Events as FileEvents, type FileAddedEvent } from 'model/File';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(materialRepositoryToken) private readonly repository: MaterialRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(materials: MaterialDTO[]) {
    const createdMaterials = await this.repository.create(materials);

    for (const { fileId } of materials) {
      const event: FileAddedEvent = { fileId };
      this.eventEmitter.emit(FileEvents.Added, event);
    }

    return createdMaterials;
  }
}
