import { Controller } from '@nestjs/common';

import {
  type ResourcesDTO,
  type ResourceUploadResponse,
  type WebResourceRequest,
  type WebResource,
  resourcesDTOSchema,
  webResourceRequestSchema,
  WebResourceMetadataRequest,
  webResourceMetadataRequestSchema,
  WebResourceMetadata,
} from 'interface/resource';
import ResourceService from 'service/ResourceService';

import { Get, Post, Body, Query, createSchemaPipe } from './decorators';

@Controller()
export default class ResourcesController {
  constructor(private readonly fileService: ResourceService) {}

  @Get('/resources/web')
  async proxyGet(
    @Query(createSchemaPipe(webResourceRequestSchema)) { url, type }: WebResourceRequest,
  ): Promise<WebResource> {
    return await this.fileService.request(url, type);
  }

  @Get('/resources/metadata')
  async fetchFileMetadata(
    @Query(createSchemaPipe(webResourceMetadataRequestSchema)) { url }: WebResourceMetadataRequest,
  ): Promise<WebResourceMetadata> {
    const fileMetadata = await this.fileService.requestMetadata(url);

    if (!fileMetadata) {
      throw new Error('invalid url');
    }

    return fileMetadata;
  }

  @Post('/resources')
  async uploadFiles(
    @Body(createSchemaPipe(resourcesDTOSchema)) { files }: ResourcesDTO,
  ): Promise<ResourceUploadResponse> {
    return await this.fileService.handleUpload(files);
  }
}
