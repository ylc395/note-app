import { Controller } from '@nestjs/common';

import { type FileVO, type WebFileMetadataVO, type FilesDTO, filesDTOSchema } from 'model/file';
import FileService from 'service/FileService';

import { Get, Body, createSchemaPipe, Patch, Param } from './decorators';

@Controller()
export default class ResourcesController {
  constructor(private readonly fileService: FileService) {}

  @Get('/files/:id')
  async queryFile(@Param('id') id: string): Promise<FileVO> {
    return await this.fileService.queryFileById(id);
  }

  @Get('/web-files/:url')
  async getWebFileMetadata(@Param('url') url: string): Promise<WebFileMetadataVO> {
    return await this.fileService.fetchWebFileMetadata(url);
  }

  @Patch('/files')
  async uploadFiles(@Body(createSchemaPipe(filesDTOSchema)) files: FilesDTO): Promise<FileVO[]> {
    return await this.fileService.createFiles(files);
  }
}
