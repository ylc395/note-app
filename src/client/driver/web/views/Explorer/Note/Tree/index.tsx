import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tooltip } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined } from '@ant-design/icons';

import NoteTree, { NoteTreeProps } from 'web/components/NoteTree';
import { Emoji } from 'web/components/Emoji';
import NoteService from 'service/NoteService';

import useDrag, { TITLE_CONTENT_CLASS } from './useDrag';
import Operations from './Operations';

export default observer(function ExplorerNoteTree({ operationEl }: { operationEl: HTMLElement | null }) {
  const { createNote, noteTree, selectNote, actByContextmenu } = container.resolve(NoteService);

  const operations = useMemo(() => {
    return operationEl && createPortal(<Operations />, operationEl);
  }, [operationEl]);

  const { draggingKeys, ...dragHandlers } = useDrag();

  const handleExpand = useCallback<NonNullable<NoteTreeProps['onExpand']>>(
    (_, { node }) => {
      if (draggingKeys.length > 0) {
        return;
      }

      noteTree.toggleExpand(node.key as string, false);
    },
    [draggingKeys, noteTree],
  );

  const titleRender = useCallback(
    (node: DataNode) => (
      <span className="flex group">
        <span className={`flex ${TITLE_CONTENT_CLASS}`}>
          <Emoji id={noteTree.getNode(node.key as string, true)?.note.icon || null} className="mr-2" />
          <span className="whitespace-nowrap">
            {__ENV__ === 'dev' ? `${node.key} ` : null}
            {node.title as string}
          </span>
        </span>
        <Tooltip title="新建子笔记" placement="right">
          <Button
            onClick={() => createNote(node.key as string)}
            className="invisible ml-auto mr-2 group-hover:visible"
            size="small"
            type="text"
            icon={<PlusOutlined />}
          />
        </Tooltip>
      </span>
    ),
    [createNote, noteTree],
  );

  return (
    <>
      <NoteTree
        noIcon
        multiple
        tree={noteTree}
        onContextmenu={actByContextmenu}
        titleRender={titleRender}
        onSelect={(_, { node, selectedNodes }) => selectNote(node.key as string, selectedNodes.length > 1)}
        draggable={{ icon: false }}
        onExpand={handleExpand}
        {...dragHandlers}
      />
      {operations}
    </>
  );
});
