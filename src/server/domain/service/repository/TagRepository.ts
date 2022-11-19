import type { InjectionToken } from '@nestjs/common';
import type { TagDTO, TagVO, TagQuery, TagPatchDTO } from 'interface/Tag';

export const token: InjectionToken = Symbol('tagRepository');

export interface TagRepository {
  create: (tag: TagDTO) => Promise<TagVO>;
  findAll: (tagQuery: TagQuery) => Promise<TagVO[]>;
  findOne: (tagQuery: TagQuery) => Promise<TagVO | undefined>;
  deleteOne: (tagId: TagVO['id'], cascade: boolean) => Promise<number>;
  update: (id: TagVO['id'], tagPatch: TagPatchDTO) => Promise<number>;
}
