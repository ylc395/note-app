import { observer } from 'mobx-react-lite';
import { useEffect, useCallback, type MouseEvent } from 'react';
import { Tree, Collapse, Button, type TreeProps } from 'antd';
import { BiPlus } from 'react-icons/bi';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import useContextmenu from 'web/hooks/useContextmenu';

export { default as TagModalForm } from './TagModalForm';
import { default as Contextmenu } from './Contextmenu';
export { default as DeleteConfirm } from './DeleteConfirm';

export const panelKey = 'tag';

export const TagTreeHeader = observer(() => {
  const {
    tagTree: { startEditingTag, selectTag },
  } = container.resolve(MaterialService);

  const handleAddButtonClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    selectTag();
    startEditingTag('create');
  }, []);

  return (
    <div className="flex justify-between flex-grow items-center">
      <span>标签管理器</span>
      <Button size="small" onClick={handleAddButtonClick} icon={<BiPlus />} />
    </div>
  );
});

export const TagTree = observer(function TagTree() {
  const {
    tagTree: { load, selectTag, selectedTagId, roots },
  } = container.resolve(MaterialService);

  const contextmenu = useContextmenu();
  const handleContextmenu = useCallback<NonNullable<TreeProps['onRightClick']>>(({ node }) => {
    selectTag(node.key as number);
    contextmenu.open();
  }, []);

  // const handleDragStart = useCallback((e: DragProps) => selectTag(e.node.value as TagTreeNode['id']), []);
  // const handleDrop = useCallback((e: OnDragProps) => updateTag({ parentId: e.node.value as TagTreeNode['id'] }), []);

  useEffect(() => {
    load();
  }, []);

  return (
    <Tree
      onSelect={(id) => selectTag(Number(id[0]))}
      onRightClick={handleContextmenu}
      selectedKeys={selectedTagId ? [selectedTagId] : []}
      treeData={roots as unknown as TreeProps['treeData']}
      fieldNames={{ title: 'name', key: 'id' }}
      blockNode
    />
  );
});
