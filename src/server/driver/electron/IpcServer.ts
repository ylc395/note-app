import { Server, type CustomTransportStrategy } from '@nestjs/microservices';
import { ipcMain } from 'electron';
import type { IpcRequest } from './handler';

export default class ElectronIpcServer
  extends Server
  implements CustomTransportStrategy
{
  listen(cb: () => void) {
    ipcMain.handle('fakeHttp', async (e, req: IpcRequest) => {
      const handler = this.messageHandlers.get(req.path);
      console.log(req);
      console.log(this.messageHandlers);

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
    return;
  }
}
