import { Controller } from '@nestjs/common';

import {
  type FilesDTO,
  type FileUploadResponse,
  filesDTOSchema,
  type HttpFileRequest,
  httpFileRequestSchema,
  HttpFile,
} from 'interface/File';
import FileService from 'service/FileService';

import { Get, Post, Body, Query, createSchemaPipe } from './decorators';

@Controller()
export default class FilesController {
  constructor(private readonly fileService: FileService) {}

  @Get('/files/external')
  async proxyGet(@Query(createSchemaPipe(httpFileRequestSchema)) { url, type }: HttpFileRequest): Promise<HttpFile> {
    return await this.fileService.request(url, type);
  }

  @Post('/files')
  async uploadFiles(@Body(createSchemaPipe(filesDTOSchema)) { files }: FilesDTO): Promise<FileUploadResponse> {
    return await this.fileService.handleUpload(files);
  }
}
