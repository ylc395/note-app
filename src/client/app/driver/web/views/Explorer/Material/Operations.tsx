import { container } from 'tsyringe';
import { SettingOutlined, ShrinkOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';

import Button from '@components/Button';
import Explorer from '@domain/model/Explorer';
import AddButton from './AddButton';

export default observer(function Operations() {
  const { materialTree } = container.resolve(Explorer);

  return (
    <div className="flex justify-between grow">
      <AddButton />
      <div>
        <Button disabled={materialTree.expandedNodes.length === 0} onClick={materialTree.collapseAll}>
          <ShrinkOutlined />
        </Button>
        <Button>
          <SettingOutlined />
        </Button>
      </div>
    </div>
  );
});
