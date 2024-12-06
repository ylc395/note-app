/// <reference lib="DOM" />
import { Type } from 'di-wise';

export interface ToastConfig {
  text: string;
  duration?: number;
  type: 'success' | 'fail';
}

export interface SelectFileConfig {
  multiple?: boolean;
  accept?: string;
}

export interface UI {
  openNewWindow: (url: string) => void;
  selectFile: (config?: SelectFileConfig) => Promise<FileList | null>;
  toast: (config: ToastConfig) => void;
}

export const token = Type<UI>('ui');
