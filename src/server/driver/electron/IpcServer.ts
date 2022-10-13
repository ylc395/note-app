import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import { ipcMain } from 'electron';

import { IPC_CHANNEL, type IpcRequest } from 'client/driver/electron/ipc';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    ipcMain.handle(IPC_CHANNEL, async (e, req: IpcRequest) => {
      const handler = this.messageHandlers.get(req.path);
      console.log(req);

      if (!handler) {
        return {
          status: 404,
          headers: {},
          body: {},
        };
      }

      const result = await handler(req);

      return {
        status: 200,
        headers: {},
        body: result,
      };
    });
    cb();
  }
  close() {
    ipcMain.removeHandler(IPC_CHANNEL);
  }
}
