import type { InjectionToken } from '@nestjs/common';
import type { TagDTO, TagVO, TagQuery } from 'interface/Tag';

export const token: InjectionToken = Symbol('tagRepository');

export interface TagRepository {
  create: (tag: TagDTO) => Promise<TagVO>;
  findAll: (tagQuery: TagQuery) => Promise<TagVO[]>;
}
