import assert from 'assert';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { first } from 'lodash-es';

import Modal from '#web/components/Modal';
import Tree from '#web/components/Tree';
import { container } from '#domain/shared/infra/singletons';
import MoveBehavior from '#domain/client/app/model/abstract/Explorer/MoveBehavior';
import Sidebar from '#domain/client/app/model/Sidebar';

import NodeTitle from './ExplorerTree/NodeTitle';

export default observer(function TargetTreeModal() {
  const { currentExplorer } = container.resolve(Sidebar);
  const { perform, cancel } = container.resolve(MoveBehavior);

  assert('tree' in currentExplorer, 'invalid currentExplorer');

  const moveTo = () => {
    const target = first(currentExplorer.tree.selectedNodes);
    assert(target, 'no target');

    perform(target.entityLocator || { entityType: currentExplorer.tree.entityType, entityId: null });
  };

  return (
    <Modal
      bodyClassName="border border-solid border-gray-200 p-4"
      title="移动至..."
      canConfirm={currentExplorer.tree.selectedNodes.length > 0}
      onConfirm={moveTo}
      onCancel={cancel}
    >
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
        iconClassName="text-gray-500"
        tree={currentExplorer.tree}
      />
    </Modal>
  );
});
