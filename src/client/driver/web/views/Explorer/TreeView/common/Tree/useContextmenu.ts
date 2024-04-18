import { container } from 'tsyringe';
import assert from 'assert';

import StarManager from '@domain/app/model/StarManager';
import type { HierarchyEntity } from '@shared/domain/model/entity';
import { Workbench, TileSplitDirections } from '@domain/app/model/workbench';
import type { MenuItemKey } from '@shared/domain/infra/ui';
import type Explorer from '@domain/app/model/abstract/Explorer';

export default function useContextmenu<T extends HierarchyEntity>(
  explorer: Explorer<T>,
  handler?: (action: MenuItemKey) => void,
) {
  const starManager = container.resolve(StarManager);
  const workbench = container.resolve(Workbench);

  return {
    onContextmenuSelect: (action: MenuItemKey) => {
      const node = explorer.tree.getSelectedNode();

      switch (action) {
        case 'rename':
          return explorer.rename.start(node.id);
        case 'star':
          return starManager.star(node.id);
        case 'unstar':
          return starManager.unstar(node.id);
        case 'openInNewTab':
          return workbench.openEntity(node.entityLocator, { forceNewTab: true });
        case 'openToTop':
        case 'openToBottom':
        case 'openToRight':
        case 'openToLeft':
          return workbench.openEntity(
            node.entityLocator,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { dest: { splitDirection: TileSplitDirections[action.match(/openTo(.+)/)![1] as any] as any } },
          );
        default:
          if (handler) {
            handler(action);
          } else {
            assert.fail(`can not handle ${action}`);
          }
      }
    },
  };
}
