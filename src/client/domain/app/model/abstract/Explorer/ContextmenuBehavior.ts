import { container } from 'tsyringe';

import { MenuItem, token as uiToken } from '@shared/domain/infra/ui';
import { TileSplitDirections, Workbench } from '../../workbench';
import StarManager from '../../StarManager';
import type Explorer from './index';
import type { ActionEvent } from '../../entity';

export default class ContextmenuBehavior {
  private readonly ui = container.resolve(uiToken);
  private readonly workbench = container.resolve(Workbench);
  private readonly star = container.resolve(StarManager);
  constructor(
    private readonly options: {
      explorer: Explorer;
      getItems: () => MenuItem[];
      handleAction: (e: ActionEvent) => void;
    },
  ) {}

  public readonly use = async () => {
    const action = await this.ui.getActionFromMenu(this.options.getItems());

    if (action) {
      this.handleAction(action);
    }
  };

  private handleAction(action: string) {
    const node = this.options.explorer.tree.getSelectedNode();

    switch (action) {
      case 'rename':
        return this.options.explorer.rename.start(node.id);
      case 'star':
        return this.star.star(node.id);
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
