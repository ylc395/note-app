import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as materialRepositoryToken, type MaterialRepository } from 'service/repository/MaterialRepository';
import { token as TagRepositoryToken, type TagRepository } from 'service/repository/TagRepository';
import type { MaterialDTO, MaterialQuery } from 'interface/Material';
import { Events as FileEvents, type FileAddedEvent } from 'model/File';
import { InvalidInputError } from 'model/Error';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(materialRepositoryToken) private readonly repository: MaterialRepository,
    @Inject(TagRepositoryToken) private readonly tagRepository: TagRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(materials: MaterialDTO[]) {
    for (const { tags: tagIds } of materials) {
      if (!tagIds) {
        continue;
      }

      const tags = await this.tagRepository.findAll({ id: tagIds });

      if (tags.length !== tagIds.length) {
        throw new InvalidInputError('无效的 tag id');
      }
    }

    const createdMaterials = await this.repository.create(materials);

    for (const { fileId } of materials) {
      const event: FileAddedEvent = { fileId };
      this.eventEmitter.emit(FileEvents.Added, event);
    }

    return createdMaterials;
  }

  async findAll(query: MaterialQuery) {
    return await this.repository.findAll(query);
  }
}
