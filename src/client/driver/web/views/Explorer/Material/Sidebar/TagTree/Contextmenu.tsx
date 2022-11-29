import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { useMemo } from 'react';
import { Dropdown, type DropdownProps } from 'antd';
import { container } from 'tsyringe';

import type { ContextmenuProps } from 'web/hooks/useContextmenu';
import MaterialService from 'service/MaterialService';
import { isDeleting } from './DeleteConfirm';

export default observer(function Contextmenu(props: ContextmenuProps) {
  const {
    tagTree: { startEditingTag },
  } = container.resolve(MaterialService);

  const menu = useMemo<DropdownProps['menu']>(
    () => ({
      items: [
        { label: '新建子标签', key: 'create' },
        { label: '重命名', key: 'rename' },
        { label: '删除', key: 'delete' },
      ],
      onClick: action(({ key }) => {
        switch (key) {
          case 'create':
            return startEditingTag('create');
          case 'delete':
            return isDeleting.set(true);
          case 'rename':
            return startEditingTag('rename');
          default:
            break;
        }
      }),
    }),
    [],
  );

  return (
    <Dropdown className="w-36" placement="bottomLeft" trigger={['contextMenu']} menu={menu} destroyPopupOnHide>
      {props.children}
    </Dropdown>
  );
});
