import type UserInput from 'infra/UserInput';

declare global {
  interface Window {
    electronIpcContextmenu?: UserInput['common']['getContextmenuAction'];
  }
}

export const ipcContextmenu = window.electronIpcContextmenu;
export const webContextmenu: UserInput['common']['getContextmenuAction'] = () => Promise.resolve(null);
