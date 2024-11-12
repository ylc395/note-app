import type { ElectronUI } from '#domain/shared/infra/ui/electron';

declare global {
  interface Window {
    readonly electronUI?: ElectronUI;
    readonly IS_ELECTRON?: true;
  }
}
