import { Controller } from '@nestjs/common';

import SyncService from '@domain/service/SyncService.js';
import { Post } from './decorators.js';

@Controller()
export default class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('/synchronization')
  async start(): Promise<void> {
    // return this.syncService.sync();
  }
}
