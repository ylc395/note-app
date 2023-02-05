import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { Tree, ConfigProvider, theme, TreeProps } from 'antd';
import { useCallback, useEffect } from 'react';

import type NoteTree from 'model/tree/NoteTree';
import type { NoteVO } from 'interface/Note';

const { useToken } = theme;

interface NoteTreeProps {
  tree: NoteTree;
  handleContextmenu?: (noteId: NoteVO['id']) => Promise<void>;
  handleSelect: TreeProps['onSelect'];
  titleRender?: TreeProps['titleRender'];
  multiple?: TreeProps['multiple'];
}

export default observer(function NoteTree({
  tree,
  handleContextmenu,
  handleSelect,
  titleRender,
  multiple,
}: NoteTreeProps) {
  const { token } = useToken();
  const { roots, toggleExpand, expandedNodes, selectedNodes, loadedNodes, loadChildren } = tree;
  const getIcon = useCallback(() => null, []);

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
        multiple={multiple}
        titleRender={titleRender}
        icon={getIcon}
        treeData={toJS(roots)}
        expandedKeys={Array.from(expandedNodes)}
        loadedKeys={Array.from(loadedNodes)}
        selectedKeys={Array.from(selectedNodes)}
        expandAction={false}
        loadData={(node) => loadChildren(node.key as string)}
        onExpand={(_, { node }) => toggleExpand(node.key as string)}
        onSelect={handleSelect}
        onRightClick={handleContextmenu && (({ node }) => handleContextmenu(node.key as string))}
      />
    </ConfigProvider>
  );
});
