import type { InjectionToken } from 'tsyringe';

interface ModalOptions {
  title: string;
  content: string;
}

interface MessageOptions {
  content: string;
  onClick?: (close: () => void) => void;
}

export type ContextmenuItem =
  | {
      label: string;
      key: string;
      disabled?: boolean;
      visible?: boolean;
    }
  | { type: 'separator' };

export interface UIInput {
  confirm: (options: ModalOptions) => Promise<boolean>;
}

export interface UIOutput {
  modal: {
    success: (option: ModalOptions) => Promise<void>;
  };
  message: {
    success: (option: MessageOptions) => Promise<void>;
  };
}

export const UIOutputToken: InjectionToken<UIOutput> = Symbol();

export const UIInputToken: InjectionToken<UIInput> = Symbol();
