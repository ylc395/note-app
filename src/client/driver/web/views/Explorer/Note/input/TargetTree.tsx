import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'antd';

import NoteTree, { VIRTUAL_ROOT_NODE_KEY } from 'model/note/Tree';
import type { NoteTreeNode } from 'model/note/Tree/type';
import NoteService from 'service/NoteService';

import Tree, { type TreeProps } from 'web/components/Tree';
import IconTitle from 'web/components/IconTitle';

const isDisabled = (selectedNodes: NoteTreeNode[]) => {
  const ids = selectedNodes.map(({ key }) => key);
  const parentIds = new Set(selectedNodes.map(({ entity: note }) => note.parentId || VIRTUAL_ROOT_NODE_KEY));

  return (node: NoteTreeNode) => {
    if (parentIds.size === 1 && parentIds.has(node.key)) {
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
  const noteService = container.resolve(NoteService);
  const [noteTree] = useState(() => {
    return new NoteTree({
      virtualRoot: true,
      isDisabled: isDisabled(selectedNodes),
      fetchChildren: noteService.fetchChildren,
      fetchTreeFragment: noteService.fetchTreeFragment,
    });
  });

  const titleRender = useCallback<NonNullable<TreeProps<NoteTreeNode>['titleRender']>>(
    (node) => (
      <span className="group flex">
        <IconTitle
          icon={node.entity.icon}
          size="1em"
          title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${node.title}`}
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
          tree={noteTree}
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
            const id = Array.from(noteTree.selectedNodes)[0]?.key;

            if (id === undefined) {
              throw new Error('no id');
            }

            onSubmit(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
          }}
        >
          保存
        </Button>
      </div>
    </div>
  );
});
