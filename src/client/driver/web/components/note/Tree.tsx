import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { Tree, ConfigProvider, theme, TreeProps } from 'antd';
import type { AntdTreeNodeAttribute } from 'antd/es/tree';
import { useCallback, useEffect } from 'react';

import type { NoteVO } from 'interface/Note';
import type NoteTree from 'model/note/Tree';
import { VIRTUAL_ROOT_NODE_KEY } from 'model/note/Tree';
import { Emoji } from 'web/components/note/Emoji';

const { useToken } = theme;

export interface NoteTreeProps {
  tree: NoteTree;
  onContextmenu?: (noteId: NoteVO['id']) => Promise<void>;
  onSelect: TreeProps['onSelect'];
  titleRender?: TreeProps['titleRender'];
  multiple?: TreeProps['multiple'];
  noIcon?: true;
  draggable?: TreeProps['draggable'];
  onDragEnd?: TreeProps['onDragEnd'];
  onDragEnter?: TreeProps['onDragEnter'];
  onDragLeave?: TreeProps['onDragLeave'];
  onDragOver?: TreeProps['onDragOver'];
  onDragStart?: TreeProps['onDragStart'];
  onDrop?: TreeProps['onDrop'];
  onExpand?: TreeProps['onExpand'];
  allowDrop?: TreeProps['allowDrop'];
}

export default observer(function NoteTree({ tree, noIcon, onContextmenu, onExpand, ...options }: NoteTreeProps) {
  const { token } = useToken();
  const { roots, toggleExpand, expandedNodes, selectedNodes, loadedNodes, loadChildren, getNode } = tree;
  const getIcon = useCallback(
    ({ eventKey }: AntdTreeNodeAttribute) => {
      if (eventKey === VIRTUAL_ROOT_NODE_KEY) {
        return null;
      }

      const { icon } = getNode(eventKey).note;
      return <Emoji className="mr-2" id={icon} />;
    },
    [getNode],
  );

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <ConfigProvider
      theme={{
        components: { Tree: { colorPrimary: token.colorPrimaryBg, colorTextLightSolid: token.colorText } },
      }}
    >
      <Tree.DirectoryTree
        icon={noIcon ? undefined : getIcon}
        treeData={toJS(roots)}
        expandedKeys={Array.from(expandedNodes)}
        loadedKeys={Array.from(loadedNodes)}
        selectedKeys={Array.from(selectedNodes)}
        expandAction={false}
        loadData={(node) => loadChildren(node.key as string)}
        onExpand={onExpand || ((_, { node }) => toggleExpand(node.key as string, false))}
        onRightClick={onContextmenu && (({ node }) => onContextmenu(node.key as string))}
        {...options}
      />
    </ConfigProvider>
  );
});
