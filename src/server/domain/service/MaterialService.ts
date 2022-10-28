import { Injectable, Inject } from '@nestjs/common';

import { token as materialRepositoryToken, type MaterialRepository } from 'service/repository/MaterialRepository';
import type { MaterialDto } from 'dto/Material';

@Injectable()
export default class MaterialService {
  constructor(@Inject(materialRepositoryToken) private readonly repository: MaterialRepository) {}

  async create(materials: MaterialDto[]) {
    return await this.repository.create(materials);
  }
}
