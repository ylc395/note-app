import type { UI } from '#domain/client/shared/infra/ui';

import selectFile from './selectFile';
import toast from './toast';

const ui: UI = {
  openNewWindow: window.electronUI?.openNewWindow || window.open,
  selectFile,
  toast,
};

export default ui;
