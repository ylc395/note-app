export interface ModalOptions {
  title: string;
  content: string;
}

export interface MessageOptions {
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
