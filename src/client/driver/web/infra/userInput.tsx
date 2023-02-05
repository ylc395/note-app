import { Modal } from 'antd';

import type UserInput from 'infra/UserInput';
import NoteTreeModel, { VIRTUAL_ROOT_NODE_KEY } from 'model/tree/NoteTree';

import NoteTree from 'driver/web/components/NoteTree';

const userInput: UserInput = {
  note: {
    async getNoteIdByTree() {
      const tree = new NoteTreeModel(true);

      return new Promise((resolve) => {
        Modal.confirm({
          icon: null,
          content: (
            <NoteTree tree={tree} handleSelect={(_, { node }) => tree.toggleSelect(node.key as string, false)} />
          ),
          onOk: () => {
            const id = Array.from(tree.selectedNodes)[0];
            resolve(id === VIRTUAL_ROOT_NODE_KEY ? null : id);
          },
          onCancel: () => resolve(undefined),
        });
      });
    },
  },
};

export default userInput;
