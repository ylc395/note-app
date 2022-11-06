import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { token as materialRepositoryToken, type MaterialRepository } from 'service/repository/MaterialRepository';
import { token as tagRepositoryToken, type TagRepository } from 'service/repository/TagRepository';
import { token as fileRepositoryToken, type FileRepository } from 'service/repository/FileRepository';
import type { MaterialDTO, MaterialQuery } from 'interface/Material';
import { Events as FileEvents, type FileAddedEvent } from 'model/File';
import { InvalidInputError } from 'model/Error';
import { TagTypes } from 'interface/Tag';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(materialRepositoryToken) private readonly repository: MaterialRepository,
    @Inject(tagRepositoryToken) private readonly tagRepository: TagRepository,
    @Inject(fileRepositoryToken) private readonly fileRepository: FileRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(materials: MaterialDTO[]) {
    for (const [i, { tags: tagIds, fileId }] of materials.entries()) {
      const file = await this.fileRepository.findOne({ id: fileId });

      if (!file) {
        throw new InvalidInputError({ [i]: { fileId: `无效的 file id: ${fileId}` } });
      }

      if (!tagIds) {
        continue;
      }

      const tags = await this.tagRepository.findAll({ id: tagIds, type: TagTypes.Material });

      if (tags.length !== tagIds.length) {
        throw new InvalidInputError({ [i]: { tags: '无效的 tag id' } });
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
