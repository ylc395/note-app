import { container } from 'tsyringe';

import { Workbench } from '@domain/app/model/workbench';
import { isDirectoryVO, isEntityMaterialVO } from '@shared/domain/model/material';
import { EntityTypes } from '@shared/domain/model/entity';
import MaterialExplorer from '@domain/app/model/material/Explorer';

import TreeView from '../../components/TreeView';
import { noop } from 'lodash-es';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialTreeView() {
  const { openEntity } = container.resolve(Workbench);
  const { tree } = container.resolve(MaterialExplorer);

  return (
    <TreeView
      onContextmenu={noop}
      onDragStart={noop}
      onDragStop={noop}
      onDrop={noop}
      tree={tree}
      onClick={({ id, entity }) =>
        tree.selectedNodes.length === 1 &&
        entity &&
        isEntityMaterialVO(entity) &&
        openEntity({ entityType: EntityTypes.Material, entityId: id, mimeType: entity.mimeType })
      }
      nodeOperation={() => []}
    />
  );
}
