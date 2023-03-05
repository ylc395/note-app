import { Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import uniq from 'lodash/uniq';

import { normalizeTitle } from 'interface/Note';
import type { NoteInputs } from 'infra/UserInput';
import NoteTree, { VIRTUAL_ROOT_NODE_KEY, type NoteTreeNode } from 'model/note/Tree';

import Tree, { TreeProps } from 'web/components/common/Tree';
import IconTitle from 'web/components/common/IconTitle';
import { COMMON_MODAL_OPTIONS } from '../utils';

const NoteTreeView = observer(function NoteTreeView({ noteTree }: { noteTree: NoteTree }) {
  const titleRender = useCallback<NonNullable<TreeProps['titleRender']>>(
    (node) => (
      <span className="group flex">
        <IconTitle
          className="cursor-pointer"
          icon={(node as NoteTreeNode).note.icon}
          size="1em"
          title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${normalizeTitle((node as NoteTreeNode).note)}`}
        />
      </span>
    ),
    [],
  );
  return (
    <div className="mt-4 h-72 overflow-auto">
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
  );
});

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

const getMoveTargetNoteId: NoteInputs['getMoveTargetNoteId'] = async (selectedNodes) => {
  if (selectedNodes.length === 0) {
    return Promise.resolve(undefined);
  }

  const noteTree = new NoteTree({
    virtualRoot: true,
    isDisabled: isDisabled(selectedNodes),
  });

  const title = selectedNodes.length > 1 ? ` ${selectedNodes.length} 项笔记` : `《${selectedNodes[0]?.title}》`;

  return new Promise((resolve) => {
    const submit = () => {
      const id = Array.from(noteTree.selectedNodes)[0];
      resolve(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
    };

    noteTree.loadChildren();

    Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      title: `移动${title}至...`,
      width: 600,
      content: <NoteTreeView noteTree={noteTree} />,
      onOk: submit,
      onCancel: () => resolve(undefined),
    });
  });
};

export default getMoveTargetNoteId;
