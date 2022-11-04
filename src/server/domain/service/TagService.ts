import { Inject } from '@nestjs/common';
import type { TagDTO, TagQuery } from 'interface/Tag';
import { InvalidInputError } from 'model/Error';
import { type TagRepository, token as tagRepositoryToken } from './repository/TagRepository';

export default class TagService {
  constructor(@Inject(tagRepositoryToken) private readonly repository: TagRepository) {}
  async create(tag: TagDTO) {
    const nameDuplicated = (await this.repository.findAll({ name: tag.name })).length > 0;

    if (nameDuplicated) {
      throw new InvalidInputError('无效的标签名', { cause: { name: '标签名已存在' } });
    }

    const invalidParent = Boolean(tag.parentId) && (await this.repository.findAll({ id: tag.parentId })).length === 0;

    if (invalidParent) {
      throw new InvalidInputError('无效的父标签 ID');
    }

    return await this.repository.create(tag);
  }

  async findAll(query: TagQuery) {
    return await this.repository.findAll(query);
  }
}