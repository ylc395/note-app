import { Injectable, Inject } from '@nestjs/common';

import { token as materialRepositoryToken, type MaterialRepository } from 'service/repository/MaterialRepository';
import type { Material } from 'model/Material';

@Injectable()
export default class MaterialService {
  constructor(@Inject(materialRepositoryToken) private readonly repository: MaterialRepository) {}

  async create(materials: Partial<Material>[]) {
    return await this.repository.create(materials);
  }
}
