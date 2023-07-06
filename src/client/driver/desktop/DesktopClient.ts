import { join } from 'node:path';

import AppClient from 'infra/AppClient';
import { NODE_ENV } from 'infra/constants';

export default class DesktopClient extends AppClient {
  readonly type = 'desktop';
  getDataDir() {
    if (NODE_ENV === 'test') {
      return join(process.cwd(), 'test', '.data');
    }

    return super.getDataDir();
  }
}
