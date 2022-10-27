import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import { ipcMain } from 'electron';

import { IPC_CHANNEL, type IpcRequest, type IpcResponse } from 'client/driver/electron/ipc';

export default class ElectronIpcServer extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    ipcMain.handle(IPC_CHANNEL, async (e, req: IpcRequest<unknown>): Promise<IpcResponse<unknown>> => {
      const handler = this.messageHandlers.get(this.normalizePattern({ path: req.path, method: req.method }));

      if (!handler) {
        return { status: 404 };
      }

      try {
        const result = await handler(req);

        return { status: 200, body: result };
      } catch (error) {
        return { status: 500, body: { error: String(error) } };
      }
    });
    cb();
  }
  close() {
    ipcMain.removeHandler(IPC_CHANNEL);
  }
}
