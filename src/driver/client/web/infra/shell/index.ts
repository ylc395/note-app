import rpc from '../../../electron/rpcClient';
import selectFile from './selectFile';

export default {
  openNewWindow: import.meta.env.VITE_WEB_PLATFORM === 'electron' ? rpc.electronUI.openUrl.mutate : window.open,
  selectFile,
};
