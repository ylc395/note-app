import { Menu } from '@ark-ui/solid';
import { SettingsIcon, ArrowDownWideNarrowIcon, SmileIcon, ChevronRightIcon, CheckIcon } from 'lucide-solid';
import { Portal, Show } from 'solid-js/web';
import { createMemo } from 'solid-js';

import container from '#utils/singletonContainer';
import shell from '#web/infra/shell';
import NoteService from '#domain/client/app/service/NoteService';
import { IconDisplayMode, SortBy } from '#domain/client/app/model/note/TreeExplorer/Setting';

export default function SettingButton() {
  const {
    explorer: { settings },
  } = container.resolve(NoteService);

  function CheckableItem<K extends keyof typeof settings>(props: {
    value: (typeof settings)[K];
    key: K;
    title: string;
  }) {
    const isChecked = createMemo(() => props.value === settings[props.key]);

    function handleClick() {
      settings[props.key] = props.value;
    }

    return (
      <Menu.Item
        onClick={handleClick}
        class="menu-item"
        classList={{ 'pl-7': !isChecked() }}
        value={`${props.key}-${props.value}`}
      >
        <Show when={isChecked()}>
          <CheckIcon />
        </Show>
        {props.title}
      </Menu.Item>
    );
  }

  return (
    <Menu.Root lazyMount unmountOnExit positioning={{ placement: 'bottom-start' }}>
      <Menu.Trigger class="button button-square-md">
        <SettingsIcon />
      </Menu.Trigger>
      <Show when={settings.isReady}>
        <Portal mount={shell.appRoot}>
          <Menu.Positioner>
            <Menu.Content class="menu">
              <Menu.Root lazyMount unmountOnExit>
                <Menu.TriggerItem class="menu-item">
                  <ArrowDownWideNarrowIcon />
                  <span class="menu-item-text">排序</span>
                  <Menu.Indicator>
                    <ChevronRightIcon />
                  </Menu.Indicator>
                </Menu.TriggerItem>
                <Portal mount={shell.appRoot}>
                  <Menu.Positioner>
                    <Menu.Content class="menu">
                      <CheckableItem title="标题 - 升序" value={SortBy.TitleAsc} key="sortBy" />
                      <CheckableItem title="标题 - 降序" value={SortBy.TitleDesc} key="sortBy" />
                      <CheckableItem title="创建时间 - 升序" value={SortBy.CreatedAtAsc} key="sortBy" />
                      <CheckableItem title="创建时间 - 降序" value={SortBy.CreatedAtDesc} key="sortBy" />
                      <CheckableItem title="更新时间 - 升序" value={SortBy.UpdatedAtAsc} key="sortBy" />
                      <CheckableItem title="更新时间 - 降序" value={SortBy.UpdatedAtDesc} key="sortBy" />
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
              <Menu.Root lazyMount unmountOnExit>
                <Menu.TriggerItem class="menu-item">
                  <SmileIcon />
                  <span class="menu-item-text">图标显示</span>
                  <Menu.Indicator>
                    <ChevronRightIcon />
                  </Menu.Indicator>
                </Menu.TriggerItem>
                <Portal mount={shell.appRoot}>
                  <Menu.Positioner>
                    <Menu.Content class="menu">
                      <CheckableItem title="不显示" value={IconDisplayMode.None} key="iconDisplayMode" />
                      <CheckableItem title="仅显示自定义图标" value={IconDisplayMode.Custom} key="iconDisplayMode" />
                      <CheckableItem title="全部显示" value={IconDisplayMode.All} key="iconDisplayMode" />
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Show>
    </Menu.Root>
  );
}
