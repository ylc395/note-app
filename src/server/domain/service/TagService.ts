import { Inject } from '@nestjs/common';
import type { TagDTO, TagTypes } from 'dto/Tag';
import { type TagRepository, token as tagRepositoryToken } from './repository/TagRepository';

export default class TagService {
  constructor(@Inject(tagRepositoryToken) private readonly repository: TagRepository) {}
  async create(tag: TagDTO) {
    const tagId = await this.repository.create(tag);
    return { ...tag, id: tagId };
  }

  async getAll(type: TagTypes) {
    return await this.repository.getAll(type);
  }
}
