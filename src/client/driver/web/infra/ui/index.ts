import type { ContextmenuItem } from 'infra/UI';

declare global {
  interface Window {
    electronIpcContextmenu?: (items: ContextmenuItem[]) => Promise<string | null>;
  }
}

const webContextmenu = () => Promise.resolve(null);

export const getContextmenuAction = window.electronIpcContextmenu || webContextmenu;
export const getRootElement = () => document.querySelector('#app') as HTMLElement;

export * from './useModal';
