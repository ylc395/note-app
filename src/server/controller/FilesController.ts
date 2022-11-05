import { Controller, UsePipes } from '@nestjs/common';

import { type FileDTO, type FileVO, FilesDTOSchema } from 'interface/File';
import FileService from 'service/FileService';

import { Post, Body, createPipe } from './decorators';

@Controller()
export default class FilesController {
  constructor(private fileService: FileService) {}

  @Post('files')
  @UsePipes(createPipe(FilesDTOSchema))
  async create(@Body() files: FileDTO[]): Promise<FileVO[]> {
    return await Promise.all(files.map((file) => this.fileService.create(file)));
  }
}
