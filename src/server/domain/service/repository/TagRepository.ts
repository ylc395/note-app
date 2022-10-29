import type { InjectionToken } from '@nestjs/common';
import type { TagDTO, TagVO, TagTypes } from 'interface/Tag';

export const token: InjectionToken = Symbol('tagRepository');

export interface TagRepository {
  create: (tag: TagDTO) => Promise<TagVO['id']>;
  getAll: (type: TagTypes) => Promise<TagVO[]>;
}
