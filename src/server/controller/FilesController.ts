import { Controller } from '@nestjs/common';

import {
  type FilesDTO,
  type FileUploadResponse,
  type HttpFileRequest,
  type HttpFile,
  filesDTOSchema,
  httpFileRequestSchema,
  HttpFileMetadataRequest,
  httpFileMetadataRequestSchema,
  HttpFileMetadata,
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

  @Get('/files/metadata')
  async fetchFileMetadata(
    @Query(createSchemaPipe(httpFileMetadataRequestSchema)) { url }: HttpFileMetadataRequest,
  ): Promise<HttpFileMetadata> {
    const fileMetadata = await this.fileService.requestMetadata(url);

    if (!fileMetadata) {
      throw new Error('invalid url');
    }

    return fileMetadata;
  }

  @Post('/files')
  async uploadFiles(@Body(createSchemaPipe(filesDTOSchema)) { files }: FilesDTO): Promise<FileUploadResponse> {
    return await this.fileService.handleUpload(files);
  }
}
