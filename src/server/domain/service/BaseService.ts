import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { EventMap } from 'model/events';

import { token as databaseToken, type Database } from 'infra/database';

@Injectable()
export default class BaseService {
  constructor(
    @Inject(databaseToken) protected readonly db: Database,
    protected readonly eventEmitter: EventEmitter2<EventMap>,
  ) {}

  protected get materials() {
    return this.db.getRepository('materials');
  }

  protected get memos() {
    return this.db.getRepository('memos');
  }

  protected get notes() {
    return this.db.getRepository('notes');
  }

  protected get recyclables() {
    return this.db.getRepository('recyclables');
  }

  protected get resources() {
    return this.db.getRepository('resources');
  }

  protected get revisions() {
    return this.db.getRepository('revisions');
  }

  protected get stars() {
    return this.db.getRepository('stars');
  }

  protected get synchronization() {
    return this.db.getRepository('synchronization');
  }
}
