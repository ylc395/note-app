import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusOutlined, ShrinkOutlined, SettingOutlined } from '@ant-design/icons';

import NoteService from '@domain/service/NoteService';
import Explorer from '@domain/model/Explorer';
import Button from '@components/Button';

export default observer(function Operations() {
  const { createNote } = container.resolve(NoteService);
  const {
    noteTree: { expandedNodes, collapseAll },
  } = container.resolve(Explorer);

  return (
    <div className="flex grow justify-between">
      <Button onClick={createNote}>
        <PlusOutlined />
      </Button>
      <div>
        <Button disabled={expandedNodes.length === 0} onClick={collapseAll}>
          <ShrinkOutlined />
        </Button>
        <Button>
          <SettingOutlined />
        </Button>
      </div>
    </div>
  );
});
