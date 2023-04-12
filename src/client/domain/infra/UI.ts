export type ContextmenuItem =
  | {
      label: string;
      key: string;
      disabled?: boolean;
      visible?: boolean;
    }
  | { type: 'separator' };
