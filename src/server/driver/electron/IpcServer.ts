import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import { ipcMain } from 'electron';

import { IPC_CHANNEL, type IpcRequest, type IpcResponse } from 'client/driver/electron/ipc';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    ipcMain.handle(IPC_CHANNEL, async (e, req: IpcRequest): Promise<IpcResponse> => {
      const handler = this.messageHandlers.get(this.normalizePattern({ path: req.path, method: req.method }));

      if (!handler) {
        return { status: 404 };
      }

      const result = await handler(req);
      return { status: 200, body: result };
    });
    cb();
  }
  close() {
    ipcMain.removeHandler(IPC_CHANNEL);
  }
}
