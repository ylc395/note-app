import { observer } from 'mobx-react-lite';
import { action, observable } from 'mobx';
import { useMemo } from 'react';
import { Dropdown } from '@douyinfe/semi-ui';
import { container } from 'tsyringe';

import type { Contextmenu } from 'web/hooks/useContextmenu';
import MaterialService from 'service/MaterialService';

export const menus = { isDeleting: observable.box(false) };

export default observer(function Contextmenu(props: Contextmenu) {
  const {
    tagTree: { startCreatingTag },
  } = container.resolve(MaterialService);

  return (
    <Dropdown
      className="w-36"
      position="bottomLeft"
      trigger="custom"
      visible={props.visible}
      onClickOutSide={props.close}
      rePosKey={props.openId}
      menu={useMemo(
        () => [
          {
            name: '新建子标签',
            node: 'item',
            onClick: action(() => {
              props.close();
              startCreatingTag();
            }),
          },
          {
            name: '删除',
            node: 'item',
            onClick: action(() => {
              props.close();
              menus.isDeleting.set(true);
            }),
          },
        ],
        [],
      )}
    >
      <div
        style={{
          position: 'fixed',
          left: props.position.x,
          top: props.position.y,
        }}
      ></div>
    </Dropdown>
  );
});
