import { Controller } from '@nestjs/common';

import { type FileVO, type FilesDTO, filesDTOSchema } from 'model/file';
import FileService from 'service/FileService';

import { Get, Body, createSchemaPipe, Patch, Param, Response, IResponse } from './decorators';

@Controller()
export default class ResourcesController {
  constructor(private readonly fileService: FileService) {}

  @Get('/files/remote/:url/blob')
  async getFileByUrl(@Param('url') url: string, @Response({ passthrough: true }) res: IResponse): Promise<ArrayBuffer> {
    const { mimeType, data } = await this.fileService.fetchRemoteFile(url);

    res.set('Content-Type', mimeType);

    return data;
  }

  @Get('/files/:id/blob')
  async queryFile(@Param('id') id: string, @Response({ passthrough: true }) res: IResponse): Promise<ArrayBuffer> {
    const { mimeType, data } = await this.fileService.queryFileById(id);

    res.set('Content-Type', mimeType);

    return data;
  }

  @Patch('/files')
  async uploadFiles(@Body(createSchemaPipe(filesDTOSchema)) files: FilesDTO): Promise<(FileVO | null)[]> {
    return await this.fileService.createFiles(files);
  }
}
