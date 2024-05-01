import type { UI } from '@domain/shared/infra/ui';

declare global {
  interface Window {
    readonly electronUI?: UI;
    readonly IS_ELECTRON?: true;
  }
}
