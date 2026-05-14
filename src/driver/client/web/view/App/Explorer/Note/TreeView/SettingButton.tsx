import { SettingsIcon, ArrowDownWideNarrowIcon, SmileIcon } from 'lucide-solid';
import { createMemo } from 'solid-js';
import { action } from 'mobx';

import { IconDisplayMode, SortBy } from '#domain/client/app/model/note/TreeExplorer/Setting';
import Button from '#web/view/components/Button';
import Menu, { type MenuItem } from '#web/view/components/Menu';
import { useContext } from '../context';

export default function SettingButton() {
  const settings = createMemo(() => useContext()!.treeExplorer.settings);

  const menu = createMemo<Array<MenuItem | 'separator'>>(() => {
    if (!settings().isReady) return [];

    return [
      {
        icon: ArrowDownWideNarrowIcon,
        label: '排序',
        key: 'sort',
        children: [
          { label: '标题 - 升序', key: `sortBy-${SortBy.TitleAsc}`, checked: settings().sortBy === SortBy.TitleAsc },
          { label: '标题 - 降序', key: `sortBy-${SortBy.TitleDesc}`, checked: settings().sortBy === SortBy.TitleDesc },
          {
            label: '创建时间 - 升序',
            key: `sortBy-${SortBy.CreatedAtAsc}`,
            checked: settings().sortBy === SortBy.CreatedAtAsc,
          },
          {
            label: '创建时间 - 降序',
            key: `sortBy-${SortBy.CreatedAtDesc}`,
            checked: settings().sortBy === SortBy.CreatedAtDesc,
          },
          {
            label: '更新时间 - 升序',
            key: `sortBy-${SortBy.UpdatedAtAsc}`,
            checked: settings().sortBy === SortBy.UpdatedAtAsc,
          },
          {
            label: '更新时间 - 降序',
            key: `sortBy-${SortBy.UpdatedAtDesc}`,
            checked: settings().sortBy === SortBy.UpdatedAtDesc,
          },
        ],
      },
      {
        icon: SmileIcon,
        label: '图标显示',
        key: 'iconDisplay',
        children: [
          {
            label: '不显示',
            key: `iconDisplayMode-${IconDisplayMode.None}`,
            checked: settings().iconDisplayMode === IconDisplayMode.None,
          },
          {
            label: '仅显示自定义图标',
            key: `iconDisplayMode-${IconDisplayMode.Custom}`,
            checked: settings().iconDisplayMode === IconDisplayMode.Custom,
          },
          {
            label: '全部显示',
            key: `iconDisplayMode-${IconDisplayMode.All}`,
            checked: settings().iconDisplayMode === IconDisplayMode.All,
          },
        ],
      },
    ];
  });

  function handleSelect(key: string) {
    if (key.startsWith('sortBy-')) {
      settings().sortBy = key.replace('sortBy-', '') as SortBy;
    } else if (key.startsWith('iconDisplayMode-')) {
      settings().iconDisplayMode = key.replace('iconDisplayMode-', '') as IconDisplayMode;
    }
  }

  return (
    <Menu menu={menu()} onSelect={action(handleSelect)}>
      {(childProps) => (
        <Button {...childProps} square>
          <SettingsIcon />
        </Button>
      )}
    </Menu>
  );
}
