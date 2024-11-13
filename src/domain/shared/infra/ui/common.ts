/// <reference lib="dom" />
import { Type } from 'di-wise';

export type MenuItemKey = string | number;

export type MenuItem = CommonMenuItem | SeparatorItem;

export interface SeparatorItem {
  type: 'separator';
}

export interface CommonMenuItem {
  label: string;
  key: MenuItemKey;
  disabled?: boolean;
  checked?: boolean;
  submenu?: MenuItem[];
}

export interface ToastConfig {
  text: string;
  duration?: number;
  type: 'success' | 'fail';
}

export interface UI {
  getActionFromMenu: (items: MenuItem[], pos?: { x: number; y: number }) => Promise<string | number | null>;
  openNewWindow: (url: string) => void;
  selectFiles: () => Promise<FileList | null>;
  toast: (config: ToastConfig) => void;
}

export const token = Type<UI>('ui');
