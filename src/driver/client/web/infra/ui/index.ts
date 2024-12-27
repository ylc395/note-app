import type { UI } from '#domain/client/shared/infra/ui';
import rpc from '../../../electron/rpcClient';

import selectFile from './selectFile';
import toast from './toast';

const ui: UI = {
  openNewWindow: import.meta.env.VITE_WEB_PLATFORM === 'electron' ? rpc.electronUI.openUrl.mutate : window.open,
  selectFile,
  toast,
};

export default ui;
