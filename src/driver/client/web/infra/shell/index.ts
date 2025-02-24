import rpc from '../../../electron/rpcClient';
import selectFile from './selectFile';
import type electronUtils from '../../../electron/preload/electronUtils';

declare global {
  interface Window {
    electronUtils?: typeof electronUtils; // web 平台没有这个
  }
}

export default {
  openNewWindow: import.meta.env.VITE_WEB_PLATFORM === 'electron' ? rpc.electronUI.openUrl.mutate : window.open,
  selectFile,
};
