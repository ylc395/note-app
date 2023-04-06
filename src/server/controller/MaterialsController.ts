import { Controller } from '@nestjs/common';

import { type DirectoryDTO, type DirectoryVO, directoryDTOSchema } from 'interface/material';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Query, Post } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Post('/materials/directories')
  async createDirectory(@Query(createSchemaPipe(directoryDTOSchema)) directory: DirectoryDTO): Promise<DirectoryVO> {
    return await this.materialService.createDirectory(directory);
  }
}
