import type { UI } from '#domain/shared/infra/ui/common';
import selectFiles from './selectFiles';
import toast from './toast';

const ui: UI = {
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || (window.open as (v: string) => void),
  selectFiles,
  toast,
};

export default ui;
