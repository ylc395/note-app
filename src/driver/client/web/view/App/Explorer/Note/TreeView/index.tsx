import { ShrinkIcon } from 'lucide-solid';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import BaseTreeView from '#web/view/components/NoteTree';
import { IconDisplayMode } from '#domain/client/app/model/note/TreeExplorer/Setting';

import AddButton from './AddButton';
import SettingButton from './SettingButton';
import useContextmenu from './useContextmenu';

export default function TreeView() {
  const { workbench, explorer } = container.resolve(NoteService);
  const { contextmenu, handleContextMenuClick } = useContextmenu();

  explorer.init();

  function handleItemClick(node: TreeNode) {
    if (!node.value) {
      return;
    }

    workbench.open({ noteId: node.value.id, mimeType: node.value.mimeType });
  }

  function shouldRenderIcon(node: TreeNode) {
    const iconMode = explorer.settings.iconDisplayMode;

    if (iconMode === IconDisplayMode.Custom) {
      return Boolean(node.value?.icon);
    }

    return iconMode === IconDisplayMode.All;
  }

  return (
    <div class="grow min-h-0 flex flex-col">
      <div class="mb-stack-s flex justify-between items-center">
        <AddButton buttonClassName="button button-primary button-md" menuPlacement="bottom-start" />
        <div class="flex">
          <button disabled={!explorer.canCollapse} onClick={explorer.collapseAll} class="button button-square-md">
            <ShrinkIcon />
          </button>
          <SettingButton />
        </div>
      </div>
      <BaseTreeView
        className="min-h-0 grow overflow-auto scrollbar-stable text-sm text-text-secondary"
        onItemTitleClick={handleItemClick}
        treeView={explorer}
        shouldRenderIcon={shouldRenderIcon}
        onContextMenuClick={handleContextMenuClick}
        contextMenu={contextmenu}
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
