import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect } from 'react';
import { toJS } from 'mobx';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { normalizeTitle } from 'interface/Note';
import NoteService from 'service/NoteService';
import type { NoteTreeNode } from 'model/note/Tree';

import Tree, { type TreeProps } from 'web/components/common/Tree';
import IconTitle from 'web/components/common/IconTitle';

export default observer(function ExplorerNoteTree() {
  const { createNote, noteTree, selectNote, actByContextmenu } = container.resolve(NoteService);
  const handleExpand = useCallback<TreeProps<NoteTreeNode>['onExpand']>(
    ({ key }) => noteTree.toggleExpand(key, false),
    [noteTree],
  );

  const handleContextmenu = useCallback<NonNullable<TreeProps<NoteTreeNode>['onContextmenu']>>(
    (node) => actByContextmenu(node.key),
    [actByContextmenu],
  );

  const loadChildren = useCallback<TreeProps<NoteTreeNode>['loadChildren']>(
    ({ key }) => noteTree.loadChildren(key),
    [noteTree],
  );

  const titleRender = useCallback<NonNullable<TreeProps<NoteTreeNode>['titleRender']>>(
    (node) => (
      <span className="group flex">
        <IconTitle
          className="cursor-pointer"
          icon={node.note.icon}
          title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${normalizeTitle(node.note)}`}
        />
        <Tooltip title="新建子笔记" placement="right">
          <Button
            onClick={(e) => {
              e.preventDefault();
              createNote(node.key);
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

  const handleSelect = useCallback<TreeProps<NoteTreeNode>['onSelect']>(
    (node, isMultiple) => selectNote(node.key, isMultiple),
    [selectNote],
  );

  useEffect(() => {
    noteTree.loadChildren();
  }, [noteTree]);

  return (
    <Tree
      multiple
      loadedKeys={Array.from(noteTree.loadedNodes)}
      treeData={toJS(noteTree.roots)}
      expandedKeys={Array.from(noteTree.expandedNodes)}
      selectedKeys={Array.from(noteTree.selectedNodes)}
      loadChildren={loadChildren}
      onContextmenu={handleContextmenu}
      titleRender={titleRender}
      onSelect={handleSelect}
      onExpand={handleExpand}
    />
  );
});
