import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tooltip } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined } from '@ant-design/icons';

import { normalizeTitle, NoteVO } from 'interface/Note';
import NoteService from 'service/NoteService';

import NoteTree, { NoteTreeProps } from 'web/components/note/Tree';
import IconTitle from 'web/components/common/IconTitle';

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
      <span className="group flex">
        <IconTitle
          className={TITLE_CONTENT_CLASS}
          icon={(node as DataNode & { note: NoteVO }).note.icon}
          title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${normalizeTitle(
            (node as DataNode & { note: NoteVO }).note,
          )}`}
        />
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
    [createNote],
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
