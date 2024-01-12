import type { UI } from '@shared/domain/infra/ui';

declare global {
  interface Window {
    readonly electronUI?: UI;
    readonly IS_ELECTRON?: true;
  }
}
