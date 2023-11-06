import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect, useContext, useState } from 'react';
import { Button } from 'antd';
import { useCreation } from 'ahooks';

import type { NoteVO } from 'model/note';
import { IS_DEV } from 'infra/constants';
import NoteTree, { type NoteTreeNode } from 'model/note/Tree';
import NoteService from 'service/NoteService';

import Tree from '../../../../../../shared/components/Tree';
import IconTitle from 'web/components/IconTitle';

import Context from './Context';

// const isDisabled = (selectedNodes: NoteTreeNode[]) => {
//   const ids = selectedNodes.map(({ key }) => key);
//   const parentIds = new Set(selectedNodes.map(({ entity: note }) => note.parentId || VIRTUAL_ROOT_NODE_KEY));

//   return (note: NoteVO, tree: TreeModel<NoteVO>) => {
//     if (parentIds.size === 1 && parentIds.has(note.id)) {
//       return true;
//     }

//     let currentNode: NoteTreeNode | NoteVO | undefined = note;

//     while (currentNode) {
//       if (ids.includes(tree.hasNode(currentNode) ? currentNode.key : currentNode.id)) {
//         return true;
//       }

//       currentNode = tree.getParentNode(currentNode);
//     }

//     return false;
//   };
// };

export default observer(function NoteTreeView() {
  const { moveNotes, fetchChildren } = container.resolve(NoteService);
  const { movingModal } = useContext(Context);
  const noteTree = useCreation(() => new NoteTree(), []);
  const [targetId, setTargetId] = useState<NoteVO['parentId'] | undefined>();

  const submit = async () => {
    if (typeof targetId === 'undefined') {
      throw new Error('no id');
    }

    await moveNotes(targetId);
    movingModal.close();
  };

  useEffect(() => {
    fetchChildren(null).then((children) => noteTree.setChildren(children, null));
  }, [fetchChildren, noteTree]);

  useEffect(() => {
    noteTree.on('nodeSelected', setTargetId);

    return () => {
      noteTree.off('nodeSelected', setTargetId);
    };
  }, [noteTree]);

  const renderTitle = (node: NoteTreeNode) => (
    <span className="group flex">
      <IconTitle
        icon={node.attributes?.icon}
        size="1em"
        title={`${IS_DEV ? `${node.id.slice(0, 3)} ` : ''}${node.title}`}
      />
    </span>
  );

  return (
    <div className="mt-4">
      <div className=" h-72 overflow-auto">
        <Tree renderTitle={renderTitle} tree={noteTree} />
      </div>
      <div className="mt-8 text-right">
        <Button onClick={movingModal.close} className="mr-4">
          取消
        </Button>
        <Button type="primary" disabled={noteTree.selectedNodes.length === 0} onClick={submit}>
          保存
        </Button>
      </div>
    </div>
  );
});