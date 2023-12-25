import { container } from 'tsyringe';
import { SettingOutlined, ShrinkOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';

import Button from '@web/components/Button';
import Explorer from '@domain/app/model/material/Explorer';
import AddButton from './AddButton';

export default observer(function Operations() {
  const { tree } = container.resolve(Explorer);

  return (
    <div className="flex justify-between grow">
      <AddButton />
      <div>
        <Button disabled={tree.expandedNodes.length === 0} onClick={tree.collapseAll}>
          <ShrinkOutlined />
        </Button>
        <Button>
          <SettingOutlined />
        </Button>
      </div>
    </div>
  );
});
