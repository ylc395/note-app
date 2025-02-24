import { ipcRenderer, webUtils } from 'electron';
import { MENU_CLICK_CHANNEL, MENU_CLOSE_CHANNEL, type MenuClickEvent, type MenuCloseEvent } from '../channels';

export default {
  onMenuClick: (handler: (e: MenuClickEvent) => void) => {
    const _handler = (_: unknown, _e: MenuClickEvent) => handler(_e);
    ipcRenderer.on(MENU_CLICK_CHANNEL, _handler);

    return () => ipcRenderer.off(MENU_CLICK_CHANNEL, _handler);
  },
  onMenuClosed: (handler: (e: MenuCloseEvent) => void) => {
    const _handler = (_: unknown, _e: MenuCloseEvent) => handler(_e);
    ipcRenderer.on(MENU_CLOSE_CHANNEL, _handler);

    return () => ipcRenderer.off(MENU_CLOSE_CHANNEL, _handler);
  },
  getFilePath(file: File) {
    return webUtils.getPathForFile(file);
  },
};
