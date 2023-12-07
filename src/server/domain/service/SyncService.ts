import { Injectable } from '@nestjs/common';
// import { object, type infer as Infer, number, string } from 'zod';
// import differenceWith from 'lodash-es/differenceWith';
// import fm from 'front-matter';

// import { type EntityLocator, EntityTypes } from '@domain/model/entity';
// import type { Conflict, Log } from '@domain/infra/synchronizer';
// import type { Note } from '@domain/model/note';
// import type { Memo } from '@domain/model/memo';
// import { type SyncTargetFactory, type SyncTarget, token as syncTargetFactoryToken } from '@domain/infra/synchronizer';

import BaseService from './BaseService.js';

// const metaSchema = object({
//   startAt: number(),
//   finishAt: number().optional(),
//   clientId: string(),
//   deviceName: string(),
//   appName: string(),
// });

// type Meta = Infer<typeof metaSchema>;

// type EntityMetadata = { id: string; updatedAt: number } & (
//   | {
//       title: string;
//       type: EntityTypes.Note;
//     }
//   | { type: EntityTypes.Memo }
// );

@Injectable()
export default class SyncService extends BaseService {
  // @Inject(syncTargetFactoryToken) private readonly syncTargetFactory!: SyncTargetFactory;
  // private syncTarget?: SyncTarget;
  // private isBusy = false;
  // private logs: Log[] = [];
  // private conflicts: Conflict[] = [];
  // private static deserialize(file: string) {
  //   const { attributes, body } = fm<EntityMetadata>(file);
  //   return { metadata: attributes, content: body };
  // }
  // private static serialize(entity: Note | Memo, { content, type }: { type: EntityTypes; content: string }) {
  //   const attributes: EntityMetadata = {
  //     id: entity.id,
  //     updatedAt: entity.updatedAt,
  //     ...(type === EntityTypes.Note
  //       ? {
  //           type: EntityTypes.Note,
  //           title: (entity as Note).title,
  //         }
  //       : {
  //           type: EntityTypes.Memo,
  //         }),
  //   };
  //   return `---\n${Object.entries(attributes)
  //     .map(([k, v]) => `${k}: ${v}`)
  //     .join('\n')}\n---\n${content}`;
  // }
  // private addLog(type: Log['type'], msg: Log['msg']) {
  //   this.logs.push({ type, msg, timestamp: Date.now() });
  // }
  // async sync() {
  //   if (this.isBusy) {
  //     this.addLog('info', '正在同步中');
  //     return;
  //   }
  //   this.isBusy = true;
  //   this.syncTarget = this.syncTargetFactory('fs');
  //   const remoteMeta = await this.getRemoteMeta();
  //   const { clientId } = this.runtime.getAppInfo();
  //   if (remoteMeta && !remoteMeta.finishAt && remoteMeta.clientId !== clientId) {
  //     this.isBusy = false;
  //     this.addLog('info', `${remoteMeta.clientId}上的${remoteMeta.appName}正在同步中`);
  //     return;
  //   }
  //   const startAt = Date.now();
  //   if (!remoteMeta) {
  //     await this.syncTarget.empty();
  //     await this.updateRemoteMeta(startAt);
  //     await this.pushAllSince();
  //   } else {
  //     await this.updateRemoteMeta(startAt);
  //     const lastSyncTime = await this.repo.synchronization.getLastFinishedSyncTimestamp();
  //     if (remoteMeta.finishAt === lastSyncTime) {
  //       // 上次同步（已完成）来自本机
  //       await this.pushAllSince(lastSyncTime);
  //     } else {
  //       // 未完成的同步（无论来自哪台机器），或上次同步不来自本机
  //       await this.process(remoteMeta);
  //     }
  //   }
  //   const finishAt = Date.now();
  //   await this.updateRemoteMeta(startAt, finishAt);
  //   await this.repo.synchronization.updateLastFinishedSyncTimestamp(finishAt);
  //   this.isBusy = false;
  // }
  // private async process(remoteMeta: Meta) {
  //   if (!this.syncTarget) {
  //     throw new Error('no remote');
  //   }
  //   const remoteEntities: EntityLocator[] = [];
  //   for await (const fileContent of this.syncTarget.list()) {
  //     const currentTime = Date.now();
  //     const { metadata: remoteEntity, content } = SyncService.deserialize(fileContent);
  //     const entityLocator: EntityLocator = { entityType: remoteEntity.type, entityId: remoteEntity.id };
  //     const localEntity = await this.getLocalEntity(entityLocator);
  //     remoteEntities.push(entityLocator);
  //     if (localEntity) {
  //       if (localEntity.metadata.updatedAt === remoteEntity.updatedAt) {
  //         continue;
  //       }
  //       const localSyncAt = (await this.repo.synchronization.getEntitySyncAt(entityLocator)) || 0;
  //       if (localEntity.metadata.updatedAt > localSyncAt) {
  //         // 本地自上次同步后存在新改动，需要推送到远程
  //         if (remoteEntity.updatedAt > localSyncAt) {
  //           // 若远程的版本更新于本机的上次同步之后，说明本地和远程存在冲突
  //           this.conflicts.push({ type: 'diff', entity: entityLocator });
  //         } else {
  //           await this.updateRemoteEntity(entityLocator);
  //         }
  //       } else {
  //         // 本地自上次同步之后没有改动
  //         await this.updateLocalEntity(remoteEntity, content);
  //       }
  //       await this.repo.synchronization.updateEntitySyncAt(entityLocator, currentTime);
  //     } else {
  //       const deletedRecord = await this.repo.recyclables.getHardDeletedRecord(entityLocator);
  //       if (!deletedRecord) {
  //         await this.createLocalEntity(remoteEntity, content);
  //         await this.repo.synchronization.updateEntitySyncAt(entityLocator, currentTime);
  //       } else if (deletedRecord.deletedAt > remoteEntity.updatedAt) {
  //         await this.syncTarget.removeFile(remoteEntity.id);
  //       } else {
  //         this.conflicts.push({ type: 'local-deleted', entity: entityLocator });
  //       }
  //     }
  //   }
  //   // 处理本地存在，远程却不存在的情况：
  //   const localEntities = await this.getLocalEntities();
  //   const localOnlyEntities = differenceWith(
  //     localEntities,
  //     remoteEntities,
  //     (localEntity, remoteEntity) =>
  //       localEntity.entityType === remoteEntity.entityType && localEntity.entityId === remoteEntity.entityId,
  //   );
  //   for (const entity of localOnlyEntities) {
  //     if (!remoteMeta.finishAt || entity.createdAt > remoteMeta.startAt) {
  //       await this.createRemoteEntity(entity);
  //     } else if (entity.updatedAt < remoteMeta.finishAt) {
  //       await this.removeLocalEntity(entity);
  //     } else {
  //       this.conflicts.push({ type: 'remote-deleted', entity });
  //     }
  //   }
  // }
  // private async createRemoteEntity(locator: EntityLocator) {
  //   if (!this.syncTarget) {
  //     throw new Error('no remote');
  //   }
  //   const localEntity = await this.getLocalEntity(locator);
  //   if (localEntity) {
  //     await this.syncTarget.putFile(
  //       localEntity.metadata.id,
  //       SyncService.serialize(localEntity.metadata, { content: localEntity.content, type: locator.entityType }),
  //     );
  //     await this.repo.synchronization.updateEntitySyncAt(locator, Date.now());
  //   }
  // }
  // private async updateRemoteEntity(locator: EntityLocator) {
  //   if (!this.syncTarget) {
  //     throw new Error('no remote');
  //   }
  //   const entity = await this.getLocalEntity(locator);
  //   if (!entity) {
  //     throw new Error('invalid entity');
  //   }
  //   await this.syncTarget.putFile(
  //     entity.metadata.id,
  //     SyncService.serialize(entity.metadata, { content: entity.content, type: locator.entityType }),
  //   );
  // }
  // private async removeLocalEntity({ entityId: id, entityType: type }: EntityLocator) {
  //   switch (type) {
  //     case EntityTypes.Note:
  //       return await this.repo.notes.removeById(id);
  //     case EntityTypes.Memo:
  //       return await this.repo.memos.removeById(id);
  //     default:
  //       break;
  //   }
  //   return;
  // }
  // private async updateLocalEntity(metadata: EntityMetadata, content: string) {
  //   switch (metadata.type) {
  //     case EntityTypes.Note:
  //       await this.repo.notes.update(metadata.id, {
  //         title: metadata.title,
  //         updatedAt: metadata.updatedAt,
  //         body: content,
  //       });
  //       return;
  //     case EntityTypes.Memo:
  //       await this.repo.memos.update(metadata.id, { content, updatedAt: metadata.updatedAt });
  //       return;
  //     default:
  //       break;
  //   }
  // }
  // private async createLocalEntity(metadata: EntityMetadata, content: string) {
  //   switch (metadata.type) {
  //     case EntityTypes.Note:
  //       await this.repo.notes.create({
  //         id: metadata.id,
  //         title: metadata.title,
  //         updatedAt: metadata.updatedAt,
  //         body: content,
  //       });
  //       return;
  //     case EntityTypes.Memo:
  //       // await this.memos.create({ id: metadata.id, content, updatedAt: metadata.updatedAt });
  //       return;
  //     default:
  //       break;
  //   }
  // }
  // private async getLocalEntity({ entityType: type, entityId: id }: EntityLocator) {
  //   let metadata: Note | Memo | null = null;
  //   let content: string | null = null;
  //   switch (type) {
  //     case EntityTypes.Note:
  //       metadata = await this.repo.notes.findOneById(id);
  //       content = await this.repo.notes.findBody(id);
  //       break;
  //     case EntityTypes.Memo:
  //       metadata = await this.repo.memos.findOneById(id);
  //       content = metadata ? metadata.content : null;
  //       break;
  //     default:
  //       throw new Error('unsupported type');
  //   }
  //   if (metadata && typeof content === 'string') {
  //     return { metadata, content };
  //   }
  //   return null;
  // }
  // private async pushAllSince(since?: number) {
  //   const localEntities = await this.getLocalEntities(since);
  //   for (const entity of localEntities) {
  //     await this.updateRemoteEntity(entity);
  //   }
  // }
  // private async getRemoteMeta() {
  //   if (!this.syncTarget) {
  //     throw new Error('no remote');
  //   }
  //   const file = await this.syncTarget.getFile('.meta');
  //   const meta = file ? JSON.parse(file) : {};
  //   return metaSchema.safeParse(meta).success ? (meta as Meta) : null;
  // }
  // private async updateRemoteMeta(startAt: number, finishAt?: number) {
  //   if (!this.syncTarget) {
  //     throw new Error('no remote');
  //   }
  //   const { deviceName, clientId, appName } = this.runtime.getAppInfo();
  //   const meta: Meta = {
  //     startAt,
  //     deviceName,
  //     clientId,
  //     appName,
  //     finishAt,
  //   };
  //   await this.syncTarget.putFile('.meta', JSON.stringify(meta));
  // }
  // private async getLocalEntities(updatedAfter?: number) {
  //   const notes = await this.repo.notes.findAll(updatedAfter ? { updatedAfter } : undefined);
  //   const memos = await this.repo.memos.findAll(updatedAfter ? { updatedAfter } : undefined);
  //   return [
  //     ...notes.map(({ id, createdAt, updatedAt }) => ({
  //       entityId: id,
  //       entityType: EntityTypes.Note,
  //       createdAt,
  //       updatedAt,
  //     })),
  //     ...memos.map(({ id, createdAt, updatedAt }) => ({
  //       entityId: id,
  //       entityType: EntityTypes.Memo,
  //       createdAt,
  //       updatedAt,
  //     })),
  //   ];
  // }
}
