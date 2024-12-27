export const MENU_CLICK_CHANNEL = 'menu-click';
export const MENU_CLOSE_CHANNEL = 'menu-close';

export interface MenuClickEvent {
  menuId: string;
  key: string;
}

export interface MenuCloseEvent {
  menuId: string;
}
