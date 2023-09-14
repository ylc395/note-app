import { Inject, Injectable } from '@nestjs/common';

import { token as databaseToken, type Database } from 'infra/database';

@Injectable()
export default class BaseService {
  constructor(@Inject(databaseToken) private readonly db: Database) {}

  get transaction() {
    return this.db.transaction.bind(this.db);
  }

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

  protected get files() {
    return this.db.getRepository('files');
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

  protected get contents() {
    return this.db.getRepository('contents');
  }
}
