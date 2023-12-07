import { Controller } from '@nestjs/common';
import multer from 'multer';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import type { IRequest, IResponse } from '@domain/infra/transport.js';
import { type FileVO, filesDTOSchema, httpUrlSchema } from '@domain/model/file.js';
import FileService from '@domain/service/FileService/index.js';

import { Get, Patch, Param, Response, Request, createSchemaPipe } from './decorators.js';

@Controller()
export default class ResourcesController {
  constructor(private readonly fileService: FileService) {}

  @Get('/files/remote/:url/blob')
  async getFileByUrl(
    @Param('url', createSchemaPipe(httpUrlSchema)) url: string,
    @Response({ passthrough: true }) res: IResponse,
  ): Promise<ArrayBuffer> {
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
  uploadFiles(@Request() req: IRequest, @Response({ passthrough: true }) res: IResponse): Promise<(FileVO | null)[]> {
    const validation = filesDTOSchema.safeParse(req.body);

    if (validation.success) {
      return this.fileService.createFiles(validation.data);
    }

    return new Promise((resolve, reject) => {
      const upload = multer().array('files[]');
      upload(req as ExpressRequest, res as ExpressResponse, (err) => {
        if (err) {
          reject(err);
          return;
        }

        const files = (req as ExpressRequest).files;

        if (Array.isArray(files)) {
          const created = this.fileService.createFiles(
            files.map((file) => ({
              mimeType: file.mimetype,
              data: file.buffer,
              lang: (req as ExpressRequest).body.lang || '',
            })),
          );
          resolve(created);
        } else {
          reject(new Error('invalid input'));
        }
      });
    });
  }
}
