import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';

import type { NoteTreeNode } from 'model/note/Tree';
import NoteService from 'service/NoteService';

import IconTitle from 'web/components/IconTitle';

export default observer(function Title({ node }: { node: NoteTreeNode }) {
  const { createNote } = container.resolve(NoteService);

  return (
    <span className="group flex">
      <IconTitle icon={node.entity.icon} title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${node.title}`} />
      <Tooltip title="新建子笔记" placement="right">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            createNote(node.key);
          }}
          className="invisible ml-auto mr-2 group-hover:visible"
          size="small"
          type="text"
          icon={<PlusOutlined />}
        />
      </Tooltip>
    </span>
  );
});
