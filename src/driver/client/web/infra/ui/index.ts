import type { UI } from '#domain/shared/infra/ui/common';
import selectFiles from './selectFiles';

const ui: UI = {
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || (window.open as (v: string) => void),
  selectFiles,
};

export default ui;
