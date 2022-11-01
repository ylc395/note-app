import { Inject } from '@nestjs/common';
import type { TagDTO, TagQuery } from 'interface/Tag';
import { InvalidInputError } from 'model/Error';
import { type TagRepository, token as tagRepositoryToken } from './repository/TagRepository';

export default class TagService {
  constructor(@Inject(tagRepositoryToken) private readonly repository: TagRepository) {}
  async create(tag: TagDTO) {
    const nameDuplicated = (await this.repository.findAll({ name: tag.name })).length > 0;

    if (nameDuplicated) {
      throw new InvalidInputError('已存在同名标签');
    }

    const invalidParent =
      Boolean(tag.parentId) && (await this.repository.findAll({ parentId: tag.parentId })).length > 0;

    if (invalidParent) {
      throw new InvalidInputError('无效的 parentId');
    }

    return await this.repository.create(tag);
  }

  async findAll(query: TagQuery) {
    return await this.repository.findAll(query);
  }
}
