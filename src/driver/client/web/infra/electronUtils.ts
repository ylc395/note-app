import type electronUtils from '../../electron/preload/electronUtils';

declare global {
  interface Window {
    electronUtils?: typeof electronUtils; // web 平台没有这个
  }
}
