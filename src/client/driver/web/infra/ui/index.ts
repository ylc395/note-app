import type { UI } from '@shared/domain/infra/ui';

const ui: UI = {
  getActionFromMenu: window.electronUI?.getActionFromMenu || (() => Promise.resolve(null)),
  openNewWindow: window.electronUI?.openNewWindow || (window.open as (v: string) => void),
};

export default ui;
