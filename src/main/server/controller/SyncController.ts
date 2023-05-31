import { Controller } from '@nestjs/common';

import SyncService from 'service/SyncService';
import { Post } from './decorators';

@Controller()
export default class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('/synchronization')
  async start(): Promise<void> {
    return this.syncService.sync();
  }
}
