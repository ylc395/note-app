import rpc from '../../../electron/rpcClient';

export default {
  openNewWindow: import.meta.env.VITE_WEB_PLATFORM === 'electron' ? rpc.electronUI.openUrl.mutate : window.open,
  appRoot: document.querySelector(`#${import.meta.env.VITE_WEB_ROOT_ID}`)!,
};
