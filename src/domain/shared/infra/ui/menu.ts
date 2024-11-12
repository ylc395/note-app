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
