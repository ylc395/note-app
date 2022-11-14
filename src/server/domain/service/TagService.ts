import { Inject } from '@nestjs/common';
import type { TagDTO, TagPatchDTO, TagQuery, TagVO } from 'interface/Tag';
import { InvalidInputError } from 'model/Error';
import { type TagRepository, token as tagRepositoryToken } from './repository/TagRepository';

export default class TagService {
  constructor(@Inject(tagRepositoryToken) private readonly repository: TagRepository) {}
  async create(tag: TagDTO) {
    const nameDuplicated = await this.repository.findOne({ name: tag.name });

    if (nameDuplicated) {
      throw new InvalidInputError({ name: '标签名已存在' });
    }

    const invalidParent = Boolean(tag.parentId) && !(await this.repository.findOne({ id: tag.parentId }));

    if (invalidParent) {
      throw new InvalidInputError({ parentId: '无效的父标签 ID' });
    }

    return await this.repository.create(tag);
  }

  async findAll(query: TagQuery) {
    return await this.repository.findAll(query);
  }

  async deleteOne(id: TagVO['id'], cascade: boolean) {
    const isExisting = await this.repository.findOne({ id });

    if (!isExisting) {
      throw new InvalidInputError({ id: 'not existed' });
    }

    return await this.repository.deleteOne(id, cascade);
  }

  async update(tagPatch: TagPatchDTO) {
    const isExisting = await this.repository.findOne({ id: tagPatch.id });

    if (!isExisting) {
      throw new InvalidInputError({ id: 'not existed' });
    }

    return await this.repository.update(tagPatch);
  }
}
