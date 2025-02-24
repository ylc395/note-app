import { ipcRenderer, webUtils } from 'electron';
import type { MenuClickEvent, MenuCloseEvent } from '../channels';

export default {
  onMenuClick: (handler: (e: MenuClickEvent) => void) => {
    const _handler = (_: unknown, _e: MenuClickEvent) => handler(_e);
    ipcRenderer.on('menu-click', _handler);

    return () => ipcRenderer.off('menu-click', _handler);
  },
  onMenuClosed: (handler: (e: MenuCloseEvent) => void) => {
    const _handler = (_: unknown, _e: MenuCloseEvent) => handler(_e);
    ipcRenderer.on('menu-closed', _handler);

    return () => ipcRenderer.off('menu-closed', _handler);
  },
  getFilePath(file: File) {
    return webUtils.getPathForFile(file);
  },
};
