import { Modal } from 'antd';

import type UserInput from 'infra/UserInput';
import NoteTreeModel, { VIRTUAL_ROOT_NODE_KEY } from 'model/tree/NoteTree';
import NoteTree from 'web/components/NoteTree';

import { COMMON_MODAL_OPTIONS } from '../utils';

const getNoteIdByTree: UserInput['note']['getNoteIdByTree'] = async (selectedNodes) => {
  if (selectedNodes.length === 0) {
    return Promise.resolve(undefined);
  }

  const tree = new NoteTreeModel({
    virtualRoot: true,
    isDisabled: (node) => {
      let currentNode: typeof node | undefined = node;
      let result =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        selectedNodes.length === 1 ? (selectedNodes[0]!.parent?.key || VIRTUAL_ROOT_NODE_KEY) === node.key : false;

      if (result) {
        return true;
      }

      const ids = selectedNodes.map(({ key }) => key);

      while (currentNode) {
        result = ids.includes(currentNode.key);

        if (result) {
          return result;
        }

        currentNode = currentNode.parent;
      }

      return false;
    },
  });

  const title = selectedNodes.length > 1 ? ` ${selectedNodes.length} 项笔记` : `《${selectedNodes[0]?.title}》`;

  return new Promise((resolve) => {
    const submit = () => {
      const id = Array.from(tree.selectedNodes)[0];
      resolve(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
    };

    Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      title: `移动${title}至...`,
      width: 600,
      content: (
        <div className="mt-4 h-72 overflow-auto">
          <NoteTree tree={tree} onSelect={(_, { node }) => tree.toggleSelect(node.key as string, true)} />
        </div>
      ),
      onOk: submit,
      onCancel: () => resolve(undefined),
    });
  });
};

export default getNoteIdByTree;
