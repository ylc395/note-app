import { ipcRenderer } from 'electron';
import type { ContextmenuItem, UI } from 'infra/ui';
import { UI_CHANNELS } from '../ui';

const electronUI: Pick<UI, 'getActionFromContextmenu' | 'openNewWindow'> = {
  getActionFromContextmenu: (menuItems: ContextmenuItem[]) => {
    if (menuItems.length === 0) {
      return Promise.resolve(null);
    }

    return ipcRenderer.invoke(UI_CHANNELS.CONTEXTMENU, menuItems);
  },
  openNewWindow: (url: string) => {
    ipcRenderer.invoke(UI_CHANNELS.NEW_WINDOW, url);
  },
};

export default electronUI;
