import { Inject, Injectable } from '@nestjs/common';
import type { IEventEmitter } from 'nest-typed-event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { EventMaps } from 'model/events';
import { token as databaseToken, type Database } from 'infra/database';

@Injectable()
export default class BaseService {
  constructor(
    @Inject(databaseToken) protected readonly db: Database,
    @Inject(EventEmitter2) protected readonly eventEmitter: IEventEmitter<EventMaps, true>,
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
