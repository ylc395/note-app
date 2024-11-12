import Button, { type Props as ButtonProps } from '#web/components/Button';
import MenuButton, { type Props as MenuButtonProps } from '#web/components/MenuButton';

export interface Props {
  icon: ButtonProps['icon'];
  onClick?: () => void;
  disabled?: ButtonProps['disabled'];

  menuItems?: MenuButtonProps['menuItems'];
}

// eslint-disable-next-line mobx/missing-observer
export default (function HeaderButton({ onClick, icon, disabled, menuItems }: Props) {
  if (menuItems) {
    return <MenuButton menuItems={menuItems} button={{ icon, disabled }} />;
  }

  return <Button onClick={() => onClick?.()} icon={icon} disabled={disabled} />;
});
