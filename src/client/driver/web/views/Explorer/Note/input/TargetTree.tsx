import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import uniq from 'lodash/uniq';
import { Button } from 'antd';

import { normalizeTitle } from 'interface/Note';
import NoteTree, { type NoteTreeNode, VIRTUAL_ROOT_NODE_KEY } from 'model/note/Tree';

import Tree, { TreeProps } from 'web/components/Tree';
import IconTitle from 'web/components/IconTitle';

const isDisabled = (selectedNodes: NoteTreeNode[]) => {
  const ids = selectedNodes.map(({ key }) => key);
  const parentIds = uniq(selectedNodes.map(({ note }) => note.parentId || VIRTUAL_ROOT_NODE_KEY));

  return (node: NoteTreeNode) => {
    if (parentIds.length === 1 && parentIds.includes(node.key)) {
      return true;
    }

    let currentNode: typeof node | undefined = node;
    while (currentNode) {
      if (ids.includes(currentNode.key)) {
        return true;
      }

      currentNode = currentNode.parent;
    }

    return false;
  };
};

interface Props {
  selectedNodes: NoteTreeNode[];
  onSubmit: (id: NoteTreeNode['key'] | null) => void;
  onCancel: () => void;
}

export default observer(function NoteTreeView({ selectedNodes, onCancel, onSubmit }: Props) {
  const [noteTree] = useState(() => {
    return new NoteTree({
      virtualRoot: true,
      isDisabled: isDisabled(selectedNodes),
    });
  });

  const titleRender = useCallback<NonNullable<TreeProps['titleRender']>>(
    (node) => (
      <span className="group flex">
        <IconTitle
          icon={(node as NoteTreeNode).note.icon}
          size="1em"
          title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${normalizeTitle((node as NoteTreeNode).note)}`}
        />
      </span>
    ),
    [],
  );

  useEffect(() => {
    noteTree.loadChildren();
  }, [noteTree]);

  return (
    <div className="mt-4">
      <div className=" h-72 overflow-auto">
        <Tree
          titleRender={titleRender}
          loadedKeys={Array.from(noteTree.loadedNodes)}
          treeData={noteTree.roots}
          expandedKeys={Array.from(noteTree.expandedNodes)}
          selectedKeys={Array.from(noteTree.selectedNodes)}
          loadChildren={({ key }) => noteTree.loadChildren(key)}
          onSelect={({ key }) => noteTree.toggleSelect(key, true)}
          onExpand={({ key }) => noteTree.toggleExpand(key, false)}
        />
      </div>
      <div className="mt-8 text-right">
        <Button onClick={onCancel} className="mr-4">
          取消
        </Button>
        <Button
          type="primary"
          disabled={noteTree.selectedNodes.size === 0}
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const id = Array.from(noteTree.selectedNodes)[0]!;
            onSubmit(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
          }}
        >
          保存
        </Button>
      </div>
    </div>
  );
});
