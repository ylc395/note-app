import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { Tree, ConfigProvider, theme, TreeProps } from 'antd';
import type { AntdTreeNodeAttribute } from 'antd/es/tree';
import { useCallback, useEffect } from 'react';

import type NoteTree from 'model/tree/NoteTree';
import type { NoteVO } from 'interface/Note';
import { Emoji } from 'driver/web/components/Emoji';

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
  const { roots, toggleExpand, expandedNodes, selectedNodes, loadedNodes, loadChildren, getNode } = tree;
  const getIcon = useCallback(
    ({ eventKey }: AntdTreeNodeAttribute) => {
      const { icon } = getNode(eventKey).note;
      return <Emoji id={icon} />;
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
        multiple={multiple}
        titleRender={titleRender}
        icon={getIcon}
        treeData={toJS(roots)}
        expandedKeys={Array.from(expandedNodes)}
        loadedKeys={Array.from(loadedNodes)}
        selectedKeys={Array.from(selectedNodes)}
        expandAction={false}
        loadData={(node) => loadChildren(node.key as string)}
        onExpand={(_, { node }) => toggleExpand(node.key as string, false)}
        onSelect={handleSelect}
        onRightClick={handleContextmenu && (({ node }) => handleContextmenu(node.key as string))}
      />
    </ConfigProvider>
  );
});
