import { Menu } from '@ark-ui/solid';
import { SettingsIcon, SortDescIcon, SmileIcon, ChevronRightIcon } from 'lucide-solid';
import { Portal } from 'solid-js/web';

import shell from '#web/infra/shell';

export default function SettingButton() {
  return (
    <Menu.Root lazyMount unmountOnExit closeOnSelect positioning={{ placement: 'bottom-start' }}>
      <Menu.Trigger class="button button-square-md">
        <SettingsIcon />
      </Menu.Trigger>
      <Portal mount={shell.appRoot}>
        <Menu.Positioner class="absolute">
          <Menu.Content class="rounded border-border-primary border p-inset-square-s bg-brand-secondary shadow text-sm z-50">
            <Menu.Item class="menu-item" value="file" onClick={(e) => e.stopPropagation()}>
              <SortDescIcon />
              排序
              <ChevronRightIcon />
            </Menu.Item>
            <Menu.Item class="menu-item" value="file" onClick={(e) => e.stopPropagation()}>
              <SmileIcon />
              图标
              <ChevronRightIcon />
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
