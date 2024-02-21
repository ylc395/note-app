import { container } from 'tsyringe';
import assert from 'assert';

import { MenuItem, token as uiToken } from '@shared/domain/infra/ui';
import { TileSplitDirections, Workbench } from '../../workbench';
import type Explorer from './index';
import type { HierarchyEntity, ActionEvent } from '../../entity';

export default class ContextmenuBehavior<T extends HierarchyEntity> {
  private readonly ui = container.resolve(uiToken);
  private readonly workbench = container.resolve(Workbench);
  constructor(
    private readonly options: {
      explorer: Explorer<T>;
      getItems: () => MenuItem[];
      handleAction: (e: ActionEvent) => void;
    },
  ) {}

  public readonly use = async () => {
    const action = await this.ui.getActionFromMenu(this.options.getItems());
    if (action) {
      this._handleAction(action);
    }
  };

  public get selectedNode() {
    const oneNode = this.options.explorer.tree.selectedNodes[0];
    assert(oneNode);

    return oneNode;
  }

  private _handleAction(action: string) {
    const node = this.selectedNode;

    switch (action) {
      case 'rename':
        return this.options.explorer.rename.start(node.id);
      case 'openInNewTab':
        return this.workbench.openEntity(node.entityLocator, { forceNewTab: true });
      case 'openToTop':
      case 'openToBottom':
      case 'openToRight':
      case 'openToLeft':
        return this.workbench.openEntity(
          node.entityLocator,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { dest: { splitDirection: TileSplitDirections[action.match(/openTo(.+)/)![1] as any] as any } },
        );
      default:
        this.options.handleAction({ action, id: this.options.explorer.tree.getSelectedNodeIds() });
    }
  }
}
