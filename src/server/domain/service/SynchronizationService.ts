import { Injectable } from '@nestjs/common';
import { object, string, type infer as Infer, number } from 'zod';
import differenceWith from 'lodash/differenceWith';

import { EntityTypes } from 'interface/entity';
import BaseService from './BaseService';
import type { EntityLocator } from 'interface/entity';

export interface Synchronizer {
  putFile: (name: string, content: string) => Promise<void>;
  getFile: (name: string) => Promise<string | null>;
  removeFile: (name: string) => Promise<void>;
  list: () => AsyncGenerator<Entity>;
}

interface Entity {
  name: string;
  id: string;
  syncId: string;
  type: EntityTypes;
  updatedAt: number;
  content: string;
}

type Conflict =
  | {
      type: 'diff';
      remote: Entity;
    }
  | {
      type: 'local-deleted';
      remote: Entity;
    }
  | {
      type: 'remote-deleted';
      local: EntityLocator;
    };

const lockSchema = object({
  appName: string(),
  machineName: string(),
});

const metaSchema = object({
  id: string(),
  finishedAt: number(),
});

@Injectable()
export default class SynchronizationService extends BaseService {
  private synchronizer?: Synchronizer;
  private status: 'idle' | 'conflict' | 'busy' = 'idle';
  private readonly logs: { timestamp: number; message: string }[] = [];
  private appendLog(message: string) {
    this.logs.push({ message, timestamp: Date.now() });
  }

  private conflicts: Conflict[] = [];

  async sync() {
    if (!this.synchronizer) {
      throw new Error('can not start');
    }

    if (this.status !== 'idle') {
      return;
    }

    this.status = 'busy';

    const lock = await this.getLock();

    if (lock) {
      this.appendLog(`一次同步正在进行中（发生于${lock.machineName}上的${lock.appName}）`);
      this.status = 'idle';
      return;
    }

    await this.setLock();
    const meta = await this.getMeta();

    if (meta !== null) {
      await this.pull(meta);
    }

    if (this.conflicts.length > 0) {
      this.status = 'conflict';
      return;
    }

    const syncId = await this.push();
    await this.updateMeta(syncId);
    await this.synchronization.updateLastFinishedSyncId(syncId);
  }

  private async pull(meta: Infer<typeof metaSchema>) {
    if (!this.synchronizer) {
      throw new Error('can not start');
    }

    if (meta.id === (await this.synchronization.getLastFinishedSyncId())) {
      return;
    }

    const allRemoteEntities: Pick<Entity, 'id' | 'type'>[] = [];

    for await (const entity of this.synchronizer.list()) {
      allRemoteEntities.push({ id: entity.id, type: entity.type });
      const has = await this.synchronization.hasEntitySyncRecord(entity.id, entity.syncId);

      if (has) {
        continue;
      }

      await this.patch(entity);
    }

    const allLocalEntities = await this.synchronization.getLocalEntities();
    const deletedRemoteEntities = differenceWith(allLocalEntities, allRemoteEntities, (local, remote) => {
      return local.id === remote.id && local.type === remote.type;
    });

    for (const entity of deletedRemoteEntities) {
      this.conflicts.push({ local: entity, type: 'remote-deleted' });
    }
  }

  private async patch(entity: Entity) {
    const localEntity = await this.getLocalEntity(entity);

    if (!localEntity) {
      const deletedRecord = await this.recyclables.getHardDeletedRecord(entity);

      if (deletedRecord && deletedRecord.deletedAt < entity.updatedAt) {
        this.conflicts.push({ remote: entity, type: 'local-deleted' });
      }

      return await this.createLocalEntity(entity);
    }

    if (localEntity.updatedAt === entity.updatedAt) {
      return;
    }

    if (localEntity.updatedAt > entity.updatedAt) {
      this.conflicts.push({ remote: entity, type: 'diff' });
    }

    await this.updateLocalEntity(entity);
  }

  private createLocalEntity(entity: Entity) {}
  private updateLocalEntity(entity: Entity) {}

  private async getLocalEntity({ type, id }: Entity) {
    if (type === EntityTypes.Note) {
      const note = await this.notes.findOneById(id);
      const noteBody = await this.notes.findBody(id);

      if (note && typeof noteBody === 'string') {
        return { ...note, body: noteBody };
      }
    }

    if (type === EntityTypes.Memo) {
      return await this.memos.findById(id);
    }

    return null;
  }

  private async push() {
    const syncId = '11111';

    return syncId;
  }

  private updateMeta(syncId: string) {}
  private async getMeta() {
    if (!this.synchronizer) {
      throw new Error('can not start');
    }

    const content = (await this.synchronizer.getFile('.meta')) || '{}';
    const lock = JSON.parse(content);

    if (lockSchema.safeParse(metaSchema).success) {
      return lock as Infer<typeof metaSchema>;
    }

    return null;
  }

  private async getLock() {
    if (!this.synchronizer) {
      throw new Error('can not start');
    }

    const content = (await this.synchronizer.getFile('.lock')) || '{}';
    const lock = JSON.parse(content);

    if (lockSchema.safeParse(lock).success) {
      return lock as Infer<typeof lockSchema>;
    }

    return null;
  }

  private async setLock() {
    if (!this.synchronizer) {
      throw new Error('can not start');
    }

    const lock: Infer<typeof lockSchema> = {
      appName: 'desktop',
      machineName: 'test',
    };

    await this.synchronizer.putFile('.lock', JSON.stringify(lock));
  }
}
