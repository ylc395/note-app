import type ElectronUI from '../UI';

declare global {
  interface Window {
    readonly electronUI?: ElectronUI;
  }
}
