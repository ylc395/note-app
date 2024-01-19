import { container } from 'tsyringe';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import Modal, { useModalValue } from '@web/components/Modal';
import Tree from '@web/components/Tree';
import TargetTree from '@domain/app/model/note/TargetTree';
import { MOVE_TARGET_MODAL } from '@domain/app/model/note/prompts';
import NodeTitle from '../common/TreeView/NodeTitle';
import NoteExplorer from '@domain/app/model/note/Explorer';

export default observer(function TargetTreeModal() {
  const { tree } = container.resolve(NoteExplorer);
  const { value: targetTree, modalProps } = useModalValue(() => TargetTree.from(tree));

  return (
    <Modal
      {...modalProps}
      id={MOVE_TARGET_MODAL}
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      getSubmitResult={() => targetTree?.targetId}
    >
      {targetTree && (
        <Tree
          showRoot
          nodeClassName={(node) =>
            clsx(
              node.isSelected && 'bg-slate-100',
              node.isDisabled && 'cursor-not-allowed opacity-30',
              'group relative cursor-pointer py-1',
            )
          }
          renderTitle={(node) => <NodeTitle node={node} />}
          caretClassName="text-gray-500"
          tree={targetTree}
        />
      )}
    </Modal>
  );
});
