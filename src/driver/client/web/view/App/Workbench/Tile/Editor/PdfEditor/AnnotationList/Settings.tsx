import { Menu } from '@ark-ui/solid';
import { SettingsIcon } from 'lucide-solid';

export default function Settings() {
  return (
    <Menu.Root>
      <Menu.Trigger>
        <SettingsIcon />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="sort">排序</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
