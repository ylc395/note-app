export interface ModalOptions {
  title: string;
  content: string;
}

export type ContextmenuItem =
  | {
      label: string;
      key: string;
      disabled?: boolean;
    }
  | { type: 'separator' };

export interface MessageOptions {
  content: string;
  onClick?: (close: () => void) => void;
}
