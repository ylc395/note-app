import { Controller, ParseIntPipe } from '@nestjs/common';

import { type FileDTO, FilesDTOSchema, type FileVO } from 'interface/File';
import FileService from 'service/FileService';

import { Post, Body, Get, createSchemaPipe, Param } from './decorators';

@Controller()
export default class FilesController {
  constructor(private fileService: FileService) {}

  @Post('/files')
  async create(@Body(createSchemaPipe(FilesDTOSchema)) files: FileDTO[]): Promise<Required<FileVO>[]> {
    return await Promise.all(files.map((file) => this.fileService.create(file)));
  }

  @Get('/files/:id/blob')
  async getBlob(@Param('id', ParseIntPipe) fileId: FileVO['id']): Promise<ArrayBuffer> {
    return await this.fileService.getBlob(fileId);
  }
}
