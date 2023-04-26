import { Injectable } from '@nestjs/common';
import { object, type infer as Infer, number, string } from 'zod';
import differenceWith from 'lodash/differenceWith';

import { type EntityLocator, EntityTypes } from 'interface/entity';
import type { Synchronizer, Conflict, Log } from 'infra/Synchronizer';
import FsSynchronizer from 'service/synchronizer/fs';

import BaseService from './BaseService';

const metaSchema = object({
  startAt: number(),
  finishAt: number().optional(),
  deviceId: string(),
  deviceName: string(),
  appName: string(),
});

type Meta = Infer<typeof metaSchema>;

export interface Entity {
  name: string;
  id: string;
  type: EntityTypes;
  updatedAt: number;
  content: string;
}

@Injectable()
export default class SynchronizationService extends BaseService {
  private remote?: Synchronizer;
  private isBusy = false;
  private logs: Log[] = [];
  private startAt?: number;
  private conflicts: Conflict[] = [];
  private deserialize(file: string) {
    return {} as Entity;
  }

  private serialize(entity: any) {
    return '';
  }

  private createRemote() {
    return new FsSynchronizer('');
  }

  private addLog(type: Log['type'], msg: Log['msg']) {
    this.logs.push({ type, msg, timestamp: Date.now() });
  }

  async sync() {
    if (this.isBusy) {
      this.addLog('info', '正在同步中');
      return;
    }

    this.isBusy = true;
    this.remote = this.createRemote();

    const remoteMeta = await this.getRemoteMeta();

    if (
      remoteMeta &&
      !remoteMeta.finishAt &&
      (remoteMeta.deviceId !== this.appClient.getDeviceName() || remoteMeta.appName !== this.appClient.getAppName())
    ) {
      this.isBusy = false;
      this.addLog('info', `${remoteMeta.deviceId}上的${remoteMeta.appName}正在同步中`);
      return;
    }

    this.startAt = Date.now();
    await this.putRemoteMeta();

    if (!remoteMeta) {
      await this.remote.empty();
      await this.pushAll();
    } else {
      const lastSyncTime = await this.synchronization.getLastFinishedSyncTimestamp();

      if (remoteMeta.finishAt === lastSyncTime) {
        await this.pushUpdatedSinceLastSync();
      } else {
        await this.process(remoteMeta);
      }
    }

    const finishAt = await this.synchronization.updateLastFinishedSyncTimestamp();
    await this.putRemoteMeta(finishAt);
    this.isBusy = false;
  }

  private async process(remoteMeta: Meta) {
    if (!this.remote) {
      throw new Error('no remote');
    }

    const remoteEntities: EntityLocator[] = [];

    for await (const fileContent of this.remote.list()) {
      const entity = this.deserialize(fileContent);
      const entityLocator: EntityLocator = { type: entity.type, id: entity.id };
      const localEntity = await this.getLocalEntity(entityLocator);

      remoteEntities.push(entityLocator);

      if (localEntity) {
        const localSyncAt = (await this.synchronization.getEntitySyncAt(entityLocator)) || 0;

        if (localEntity.updatedAt > localSyncAt) {
          // 本地需要推送到远程了
          if (entity.updatedAt > localSyncAt) {
            // 若远程的版本更新于本机的上次同步之后，说明本地和远程存在冲突
            this.conflicts.push({ type: 'diff', entity: entityLocator });
          } else {
            await this.uploadEntity(entityLocator);
          }
        } else {
          await this.downloadEntity(entityLocator);
        }
      } else {
        const deletedRecord = await this.recyclables.getHardDeletedRecord(entityLocator);

        if (!deletedRecord) {
          await this.createLocalEntity(entityLocator);
        } else if (deletedRecord.deletedAt > entity.updatedAt) {
          await this.remote.removeFile(entity.id);
        } else {
          this.conflicts.push({ type: 'local-deleted', entity: entityLocator });
        }
      }
    }

    // 处理本地存在，远程却不存在的情况：
    const localEntities = await this.synchronization.getLocalEntities();
    const localOnlyEntities = differenceWith(
      localEntities,
      remoteEntities,
      (localEntity, remoteEntity) => localEntity.type === remoteEntity.type && localEntity.id === remoteEntity.id,
    );

    for (const entity of localOnlyEntities) {
      if (!remoteMeta.finishAt || entity.createdAt > remoteMeta.startAt) {
        const localEntity = await this.getLocalEntity(entity);
        await this.remote.putFile(entity.id, this.serialize(localEntity));
      } else if (entity.updatedAt < remoteMeta.finishAt) {
        await this.removeEntity(entity);
      } else {
        this.conflicts.push({ type: 'remote-deleted', entity });
      }
    }
  }

  private uploadEntity(entity: EntityLocator) {
    return;
  }

  private removeEntity(entity: EntityLocator) {
    return;
  }

  private downloadEntity(entity: EntityLocator) {
    return;
  }

  private async createLocalEntity(locator: EntityLocator) {
    return;
  }

  private getLocalEntity({ type, id }: EntityLocator) {
    switch (type) {
      case EntityTypes.Note:
        return this.notes.findOneById(id);
      case EntityTypes.Memo:
        return this.memos.findOneById(id);
      default:
        throw new Error('unsupported type');
    }
  }

  private async pushAll() {
    const localEntities = await this.synchronization.getLocalEntities();

    for (const entity of localEntities) {
      await this.uploadEntity(entity);
    }
  }

  private pushUpdatedSinceLastSync() {
    return;
  }

  private async getRemoteMeta() {
    if (!this.remote) {
      throw new Error('no remote');
    }

    const file = await this.remote.getFile('.meta');
    const meta = file ? JSON.parse(file) : {};

    return metaSchema.safeParse(meta).success ? (meta as Meta) : null;
  }

  private async putRemoteMeta(finishAt?: number) {
    if (!this.remote || !this.startAt) {
      throw new Error('no remote');
    }

    const meta: Meta = {
      startAt: this.startAt,
      deviceName: this.appClient.getDeviceName(),
      deviceId: this.appClient.getAppId(),
      appName: this.appClient.getAppName(),
      finishAt,
    };

    await this.remote.putFile('.meta', JSON.stringify(meta));
  }
}
