import { ShrinkIcon } from 'lucide-solid';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import BaseTreeView from '#web/view/components/NoteTree';
import { IconDisplayMode } from '#domain/client/app/model/note/TreeExplorer/Setting';

import AddButton from './AddButton';
import SettingButton from './SettingButton';
import useContextmenu from './useContextmenu';
import Button from '#web/view/components/Button';

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
      <div class="mb-4 flex justify-between items-center">
        <AddButton />
        <div class="flex">
          <Button disabled={!explorer.canCollapse} onClick={explorer.collapseAll} square>
            <ShrinkIcon />
          </Button>
          <SettingButton />
        </div>
      </div>
      <BaseTreeView
        className="min-h-0 grow overflow-auto scrollbar-stable text-sm text-fg-secondary"
        onItemTitleClick={handleItemClick}
        treeView={explorer}
        shouldRenderIcon={shouldRenderIcon}
        onContextMenuClick={handleContextMenuClick}
        contextMenu={contextmenu}
        renderOperation={(node) => <AddButton iconOnly node={node} class="hidden group-hover:flex ml-2" />}
      />
    </div>
  );
}
