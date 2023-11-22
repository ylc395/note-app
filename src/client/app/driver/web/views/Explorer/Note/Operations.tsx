import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { PlusOutlined, ShrinkOutlined, SettingOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';
import IconButton from 'web/components/IconButton';

export default observer(function Operations() {
  const {
    tree: { expandedNodes, collapseAll },
    createNote,
  } = container.resolve(NoteService);

  return (
    <div className="flex justify-between">
      <IconButton onClick={createNote}>
        <PlusOutlined />
      </IconButton>
      <IconButton disabled={expandedNodes.length === 0} onClick={collapseAll}>
        <ShrinkOutlined />
      </IconButton>
      <IconButton>
        <SettingOutlined />
      </IconButton>
    </div>
  );
});
