import Button from '#web/view/components/Button';
import { Menu } from '@ark-ui/solid';
import { SettingsIcon } from 'lucide-solid';

export default function Settings() {
  return (
    <Menu.Root>
      <Menu.Trigger
        asChild={(props) => (
          <Button square size="small" {...props()}>
            <SettingsIcon />
          </Button>
        )}
      ></Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="sort">排序</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
