import { Controller } from '@nestjs/common';

import { type FilesDTO, type FileUploadResponse, filesDTOSchema } from 'interface/File';
import FileService from 'service/FileService';

import { Post, Body, createSchemaPipe } from './decorators';

@Controller()
export default class FilesController {
  constructor(private readonly fileService: FileService) {}
  @Post('/files')
  async uploadFiles(@Body(createSchemaPipe(filesDTOSchema)) { files }: FilesDTO): Promise<FileUploadResponse> {
    return await this.fileService.handleUpload(files);
  }
}
