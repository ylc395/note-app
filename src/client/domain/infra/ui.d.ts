export interface ModalOptions {
  title: string;
  content: string;
}

export type ContextmenuItem =
  | {
      label: string;
      key: string;
    }
  | { type: 'separator' };

export interface MessageOptions {
  content: string;
  onClick?: (close: () => void) => void;
}
