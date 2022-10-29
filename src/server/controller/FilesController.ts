import { Controller } from '@nestjs/common';

import type { FileDTO, FileVO } from 'interface/File';
import FileService from 'service/FileService';

import { Post, Body } from './decorators';

@Controller()
export default class FilesController {
  constructor(private fileService: FileService) {}

  @Post('files')
  async create(@Body() files: FileDTO[]): Promise<FileVO[]> {
    return await Promise.all(files.map((file) => this.fileService.create(file)));
  }
}
