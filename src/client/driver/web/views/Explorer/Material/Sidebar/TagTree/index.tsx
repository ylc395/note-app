import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { comparer, computed } from 'mobx';
import { Tree, Collapse, Button } from '@douyinfe/semi-ui';
import type { TreeNodeData, TreeProps } from '@douyinfe/semi-ui/lib/es/tree';
import { IconPlusStroked } from '@douyinfe/semi-icons';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default observer(function Sidebar() {
  const {
    tagTree: { load, roots, startCreatingTag, selectTag },
  } = container.resolve(MaterialService);

  useEffect(() => {
    load();
  }, []);

  return (
    <Collapse.Panel
      header={
        <div className="flex justify-between flex-grow items-center">
          <span>标签管理器</span>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              startCreatingTag();
            }}
            icon={<IconPlusStroked />}
          />
        </div>
      }
      itemKey="tag"
    >
      <Tree
        onChange={selectTag as TreeProps['onChange']}
        treeData={computed(function transform(nodes = roots): TreeNodeData[] {
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
        }).get()}
      />
    </Collapse.Panel>
  );
});
