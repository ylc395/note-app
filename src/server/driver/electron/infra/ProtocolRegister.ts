import { protocol } from 'electron';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { type Database, token as databaseToken } from 'infra/database';
import { APP_PROTOCOL } from 'infra/constants';
import { getFileIdFromUrl } from 'utils/url';

import type Repositories from 'service/repository';

@Injectable()
export default class ProtocolRegister {
  constructor(private readonly moduleRef: ModuleRef) {}

  register() {
    let fileRepository: Repositories['files'];
    const db = this.moduleRef.get<Database>(databaseToken, { strict: false });

    protocol.registerBufferProtocol(APP_PROTOCOL, async (req, res) => {
      if (!fileRepository) {
        fileRepository = db.getRepository('files');
      }

      const resourceId = getFileIdFromUrl(req.url);

      if (!resourceId) {
        res({ statusCode: 404 });
        return;
      }

      const file = await fileRepository.findOneById(resourceId);
      const data = await fileRepository.findBlobById(resourceId);

      if (!file || !data) {
        res({ statusCode: 404 });
      } else {
        res({ data: Buffer.from(data as ArrayBuffer), headers: { 'Content-Type': file.mimeType } });
      }
    });
  }
}
