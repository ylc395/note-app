import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect, useContext } from 'react';
import { Button } from 'antd';
import { useCreation } from 'ahooks';

import type { NoteVO } from 'interface/Note';
import NoteTree, { VIRTUAL_ROOT_NODE_KEY, type NoteTreeNode } from 'model/note/Tree';
import NoteService from 'service/NoteService';

import Tree, { type TreeProps } from 'web/components/Tree';
import IconTitle from 'web/components/IconTitle';
import type { Tree as TreeModel } from 'model/abstract/Tree';

import Context from './Context';

const isDisabled = (selectedNodes: NoteTreeNode[]) => {
  const ids = selectedNodes.map(({ key }) => key);
  const parentIds = new Set(selectedNodes.map(({ entity: note }) => note.parentId || VIRTUAL_ROOT_NODE_KEY));

  return (note: NoteVO, tree: TreeModel<NoteVO>) => {
    if (parentIds.size === 1 && parentIds.has(note.id)) {
      return true;
    }

    let currentNode: NoteTreeNode | NoteVO | undefined = note;

    while (currentNode) {
      if (ids.includes(tree.hasNode(currentNode) ? currentNode.key : currentNode.id)) {
        return true;
      }

      currentNode = tree.getParentNode(currentNode);
    }

    return false;
  };
};

export default observer(function NoteTreeView() {
  const { moveNotes, fetchChildren, fetchTreeFragment, noteTree: originalNoteTree } = container.resolve(NoteService);
  const { movingModal } = useContext(Context);
  const noteTree = useCreation(
    () =>
      new NoteTree({
        virtualRoot: true,
        isDisabled: isDisabled(Array.from(originalNoteTree.selectedNodes)),
        fetchChildren,
        fetchTreeFragment,
      }),
    [],
  );
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

  const submit = useCallback(async () => {
    const id = Array.from(noteTree.selectedNodes)[0]?.key;

    if (id === undefined) {
      throw new Error('no id');
    }

    await moveNotes(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
    movingModal.close();
  }, [moveNotes, movingModal, noteTree.selectedNodes]);

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
        <Button onClick={movingModal.close} className="mr-4">
          取消
        </Button>
        <Button type="primary" disabled={noteTree.selectedNodes.size === 0} onClick={submit}>
          保存
        </Button>
      </div>
    </div>
  );
});
