import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tooltip } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';
import NoteTree from 'driver/web/components/NoteTree';

import Operations from './Operations';

export default observer(function ExplorerNoteTree({ operationEl }: { operationEl: HTMLElement | null }) {
  const { createNote, noteTree, selectNote, actByContextmenu } = container.resolve(NoteService);

  const operations = useMemo(() => {
    return operationEl && createPortal(<Operations />, operationEl);
  }, [operationEl]);

  const titleRender = useCallback(
    (node: DataNode) => (
      <span className="inline-flex group">
        <span className="whitespace-nowrap">{node.title as string}</span>
        <Tooltip title="新建子笔记" placement="right">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              createNote(node.key as string);
            }}
            className="invisible ml-auto mr-2 group-hover:visible"
            size="small"
            type="text"
            icon={<PlusOutlined />}
          />
        </Tooltip>
      </span>
    ),
    [createNote],
  );

  return (
    <>
      <NoteTree
        multiple
        tree={noteTree}
        handleContextmenu={actByContextmenu}
        titleRender={titleRender}
        handleSelect={(_, { node, selectedNodes }) => selectNote(node.key as string, selectedNodes.length > 1)}
      />
      {operations}
    </>
  );
});
