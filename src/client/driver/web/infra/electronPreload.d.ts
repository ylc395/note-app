import type { Remote } from '@domain/common/infra/remote';
import type { UI } from '@domain/app/infra/ui';

declare global {
  interface Window {
    readonly electronIpcHttpClient?: Remote;
    readonly electronUI?: UI;
    readonly IS_ELECTRON?: true;
  }
}
