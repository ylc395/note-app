import { observer } from 'mobx-react-lite';
import { useEffect, useCallback, useMemo, type MouseEvent } from 'react';
import { computed } from 'mobx';
import { Tree, Collapse, Button } from '@douyinfe/semi-ui';
import type { TreeNodeData, TreeProps } from '@douyinfe/semi-ui/lib/es/tree';
import { IconPlusStroked } from '@douyinfe/semi-icons';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import useContextmenu from 'web/hooks/useContextmenu';
import TagModalForm from './TagModalForm';
import Contextmenu from './Contextmenu';
import DeleteConfirm from './DeleteConfirm';

export const panelKey = 'tag';

export default observer(function Sidebar() {
  const {
    tagTree: { load, startCreatingTag, selectTag, roots },
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
    startCreatingTag();
  }, []);

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Collapse.Panel
        header={
          <div className="flex justify-between flex-grow items-center">
            <span>标签管理器</span>
            <Button size="small" onClick={handleAddButtonClick} icon={<IconPlusStroked />} />
          </div>
        }
        itemKey={panelKey}
      >
        <Tree
          onChange={selectTag as TreeProps['onChange']}
          treeData={treeData.get()}
          onContextMenu={handleContextmenu}
        />
        <Contextmenu {...contextmenu} />
      </Collapse.Panel>
      <TagModalForm />
      <DeleteConfirm />
    </>
  );
});
