import { Controller } from '@nestjs/common';

import { type FileVO, type FilesDTO, filesDTOSchema } from 'model/file';
import FileService from 'service/FileService';

import { Get, Body, createSchemaPipe, Patch, Param, Response, IResponse } from './decorators';

@Controller()
export default class ResourcesController {
  constructor(private readonly fileService: FileService) {}

  @Get('/files/remote/:url')
  async getFileByUrl(@Param('url') url: string, @Response({ passthrough: true }) res: IResponse): Promise<ArrayBuffer> {
    const { mimeType, size, data } = await this.fileService.fetchRemoteFile(url);

    res.set('Content-Type', mimeType);
    res.set('Content-Length', String(size));

    return data;
  }

  @Get('/files/:id')
  async queryFile(@Param('id') id: string, @Response({ passthrough: true }) res: IResponse): Promise<ArrayBuffer> {
    const { mimeType, data, size } = await this.fileService.queryFileById(id);

    res.set('Content-Type', mimeType);
    res.set('Content-Length', String(size));

    return data;
  }

  @Patch('/files')
  async uploadFiles(@Body(createSchemaPipe(filesDTOSchema)) files: FilesDTO): Promise<FileVO[]> {
    return await this.fileService.createFiles(files);
  }
}
