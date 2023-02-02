import type { Contextmenu } from 'infra/Contextmenu';

declare global {
  interface Window {
    electronIpcContextmenu?: Contextmenu;
  }
}

export const ipcContextmenu = window.electronIpcContextmenu;
export const webContextmenu: Contextmenu = {
  popup: () => Promise.resolve(null),
};
