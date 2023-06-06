import { protocol } from 'electron';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { type Database, token as databaseToken } from 'infra/database';
import { APP_FILE_PROTOCOL } from 'infra/constants';

import type Repositories from 'service/repository';
import ResourceService from 'service/ResourceService';

@Injectable()
export default class ProtocolRegister {
  constructor(private readonly moduleRef: ModuleRef) {}

  register() {
    let resourceRepository: Repositories['resources'];
    const db = this.moduleRef.get<Database>(databaseToken, { strict: false });

    protocol.registerBufferProtocol(APP_FILE_PROTOCOL, async (req, res) => {
      if (!resourceRepository) {
        resourceRepository = db.getRepository('resources');
      }

      const resourceId = ResourceService.getResourceIdFromUrl(req.url);

      if (!resourceId) {
        res({ statusCode: 404 });
        return;
      }

      const file = await resourceRepository.findFileById(resourceId);

      if (!file) {
        res({ statusCode: 404 });
      } else {
        res({ data: Buffer.from(file.data), headers: { 'Content-Type': file.mimeType } });
      }
    });
  }
}
