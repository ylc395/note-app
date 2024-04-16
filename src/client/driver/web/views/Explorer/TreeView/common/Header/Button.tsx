import Button, { type Props as ButtonProps } from '@web/components/Button';
import MenuButton, { type Props as MenuButtonProps } from '@web/components/MenuButton';

export interface Props {
  icon: ButtonProps['icon'];
  onClick?: () => void;
  disabled?: ButtonProps['disabled'];

  menuOptions?: {
    items: MenuButtonProps['menuItems'];
    onSelect: MenuButtonProps['onSelect'];
  };
}

// eslint-disable-next-line mobx/missing-observer
export default (function HeaderButton({ onClick, icon, disabled, menuOptions }: Props) {
  if (menuOptions) {
    return <MenuButton menuItems={menuOptions.items} onSelect={menuOptions.onSelect} button={{ icon, disabled }} />;
  }

  return <Button onClick={() => onClick?.()} icon={icon} disabled={disabled} />;
});
