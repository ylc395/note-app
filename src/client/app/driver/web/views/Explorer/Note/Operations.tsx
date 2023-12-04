import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusOutlined, ShrinkOutlined, SettingOutlined } from '@ant-design/icons';

import NoteService from '@domain/service/NoteService';
import Explorer from '@domain/model/Explorer';
import IconButton from '@components/IconButton';

export default observer(function Operations() {
  const { createNote } = container.resolve(NoteService);
  const {
    noteTree: { expandedNodes, collapseAll },
  } = container.resolve(Explorer);

  return (
    <div className="flex grow justify-between">
      <IconButton onClick={createNote}>
        <PlusOutlined />
      </IconButton>
      <div>
        <IconButton disabled={expandedNodes.length === 0} onClick={collapseAll}>
          <ShrinkOutlined />
        </IconButton>
        <IconButton>
          <SettingOutlined />
        </IconButton>
      </div>
    </div>
  );
});
