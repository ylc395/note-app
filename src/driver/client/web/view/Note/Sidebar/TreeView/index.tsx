import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';

import BaseTreeView from '#web/components/NoteTree';
import AddButton from './AddButton';

export default function TreeView() {
  const { workbench, exploreTreeView: tree } = container.resolve(NoteService);

  function handleItemClick(node: TreeNode) {
    if (!node.value) {
      return;
    }

    workbench.open(node.value);
  }

  return (
    <div class="grow min-h-0 flex flex-col">
      <div class="mb-stack-s">
        <AddButton buttonClassName="button button-primary button-md" menuPlacement="bottom-start" />
      </div>
      <BaseTreeView
        className="min-h-0 grow overflow-auto scrollbar-stable scrollbar-thin"
        onItemTitleClick={handleItemClick}
        treeView={tree}
        renderOperation={(node) => (
          <AddButton
            buttonClassName='button button-primary button-square-tiny text-brand-secondary h-full ml-inset-squish group-hover:flex data-[state="open"]:flex hidden'
            iconOnly
            node={node}
            menuPlacement="bottom-end"
          />
        )}
      />
    </div>
  );
}
