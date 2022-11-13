import { observer } from 'mobx-react-lite';
import { Dropdown } from '@douyinfe/semi-ui';

import type { Contextmenu } from 'web/hooks/useContextmenu';

export default observer(function Contextmenu(props: Contextmenu) {
  return (
    <Dropdown
      className="w-36"
      position="bottomLeft"
      trigger="custom"
      visible={props.visible}
      onClickOutSide={props.close}
      rePosKey={props.openId}
      menu={[{ name: '删除', node: 'item' }]}
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
