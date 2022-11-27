import { observer } from 'mobx-react-lite';
import { useEffect, useCallback, useMemo, type MouseEvent } from 'react';
import { computed } from 'mobx';
import { Tree, Collapse, Button } from '@douyinfe/semi-ui';
import type { DragProps, OnDragProps, TreeNodeData, TreeProps } from '@douyinfe/semi-ui/lib/es/tree';
import { BiPlus } from 'react-icons/bi';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import useContextmenu from 'web/hooks/useContextmenu';
import TagModalForm from './TagModalForm';
import Contextmenu from './Contextmenu';
import DeleteConfirm from './DeleteConfirm';
import type { TagTreeNode } from 'model/TagTree';

export const panelKey = 'tag';

export default observer(function Sidebar() {
  const {
    tagTree: { load, startEditingTag, selectTag, updateTag, selectedTagId, roots },
  } = container.resolve(MaterialService);

  const treeData = useMemo(
    () =>
      computed(function transform(nodes = roots): TreeNodeData[] {
        return nodes.map((node) => {
          const newNode: TreeNodeData = {
            label: node.name,
            value: node.id,
            key: String(node.id),
          };

          if (node.children) {
            newNode.children = transform(node.children);
          }

          return newNode;
        });
      }),
    [roots],
  );

  const contextmenu = useContextmenu();
  const handleContextmenu = useCallback((_: unknown, { value }: TreeNodeData) => {
    selectTag(value as number);
    contextmenu.open();
  }, []);

  const handleAddButtonClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    selectTag();
    startEditingTag('create');
  }, []);

  const handleDragStart = useCallback((e: DragProps) => selectTag(e.node.value as TagTreeNode['id']), []);
  const handleDrop = useCallback((e: OnDragProps) => updateTag({ parentId: e.node.value as TagTreeNode['id'] }), []);

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Collapse.Panel
        header={
          <div className="flex justify-between flex-grow items-center">
            <span>标签管理器</span>
            <Button size="small" onClick={handleAddButtonClick} icon={<BiPlus />} />
          </div>
        }
        itemKey={panelKey}
      >
        <Tree
          onChange={selectTag as TreeProps['onChange']}
          onContextMenu={handleContextmenu}
          value={selectedTagId}
          treeData={treeData.get()}
          draggable
          filterTreeNode
          hideDraggingNode
          searchClassName="p-0"
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
        <Contextmenu {...contextmenu} />
      </Collapse.Panel>
      <TagModalForm />
      <DeleteConfirm />
    </>
  );
});
