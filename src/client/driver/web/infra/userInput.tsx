import { Modal } from 'antd';

import type UserInput from 'infra/UserInput';
import NoteTreeModel, { VIRTUAL_ROOT_NODE_KEY } from 'model/tree/NoteTree';

import NoteTree from 'driver/web/components/NoteTree';

const getContainer = () => document.querySelector('#app') as HTMLElement;

const userInput: UserInput = {
  common: {
    confirm: (options) => {
      return new Promise((resolve) => {
        Modal.confirm({
          ...options,
          autoFocusButton: null,
          okText: '确认',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    },
  },
  note: {
    async getNoteIdByTree(selectedNodes) {
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

          while (currentNode) {
            result = selectedNodes.map(({ key }) => key).includes(currentNode.key);

            if (result) {
              return result;
            }

            currentNode = currentNode.parent;
          }

          return false;
        },
      });

      return new Promise((resolve) => {
        Modal.confirm({
          autoFocusButton: null,
          okText: '确认',
          cancelText: '取消',
          getContainer,
          icon: null,
          title: `移动${
            selectedNodes.length > 1 ? ` ${selectedNodes.length} 项笔记` : `《${selectedNodes[0]?.title}》`
          }至...`,
          width: 600,
          content: (
            <div className="mt-4 h-72 overflow-auto">
              <NoteTree tree={tree} handleSelect={(_, { node }) => tree.toggleSelect(node.key as string, true)} />
            </div>
          ),
          onOk: () => {
            const id = Array.from(tree.selectedNodes)[0];

            if (id === undefined) {
              return true;
            }

            resolve(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
          },
          onCancel: () => resolve(undefined),
        });
      });
    },
  },
};

export default userInput;
