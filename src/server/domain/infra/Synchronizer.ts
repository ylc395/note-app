// import { Inject } from '@nestjs/common';
// import { token as dbToken, type Database } from './Database';

// interface File {
//   path: string;
// }

// enum Steps {
//   FetchingRemote,
//   UpdatingLocal,
//   UpdatingRemote,
// }

// const LOCK_FILENAME = '.lock';

// export default abstract class Synchronizer {
//   readonly logs: string[] = [];
//   protected abstract readonly basePath: string[];
//   protected remoteFiles: File[] = [];
//   protected abstract fetchRemote(): Promise<File[]>;
//   protected abstract putFile(path: string, content: string): Promise<File>;
//   protected abstract removeFile(path: string): Promise<void>;

//   private isLocked() {
//     return this.remoteFiles.some((file) => file.path === `/${LOCK_FILENAME}`);
//   }

//   private async putLock() {
//     await this.putFile(
//       `/${LOCK_FILENAME}`,
//       JSON.stringify({ clientId: this.client.getClientId(), deviceName: this.client.getDeviceName() }),
//     );
//   }

//   private async releaseLock() {
//     await this.removeFile(`/${LOCK_FILENAME}`);
//   }

//   async start() {
//     this.remoteFiles = await this.fetchRemote();

//     if (this.isLocked()) {
//       this.logs.push('其他客户端正在同步中，请在稍后点击重试');
//       return;
//     }

//     await this.putLock();

//     await this.releaseLock();
//   }
// }
