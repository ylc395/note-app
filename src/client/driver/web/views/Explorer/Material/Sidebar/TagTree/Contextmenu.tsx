import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { useMemo } from 'react';
import { Dropdown } from 'antd';
import { container } from 'tsyringe';

import type { Contextmenu } from 'web/hooks/useContextmenu';
import MaterialService from 'service/MaterialService';
import { isDeleting } from './DeleteConfirm';

export default observer(function Contextmenu(props: Contextmenu) {
  const {
    tagTree: { startEditingTag },
  } = container.resolve(MaterialService);

  return (
    <Dropdown
      className="w-36"
      placement="bottomLeft"
      open={props.visible}
      onOpenChange={props.close}
      // items={useMemo(
      //   () => [
      //     {
      //       name: '新建子标签',
      //       node: 'item',
      //       onClick: action(() => {
      //         props.close();
      //         startEditingTag('create');
      //       }),
      //     },
      //     {
      //       name: '重命名',
      //       node: 'item',
      //       onClick: action(() => {
      //         props.close();
      //         startEditingTag('rename');
      //       }),
      //     },
      //     {
      //       name: '删除',
      //       node: 'item',
      //       onClick: action(() => {
      //         props.close();
      //         isDeleting.set(true);
      //       }),
      //     },
      //   ],
      //   [],
      // )}
    ></Dropdown>
  );
});
