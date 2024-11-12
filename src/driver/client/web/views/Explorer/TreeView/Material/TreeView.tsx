import { container } from 'tsyringe';
import { PlusIcon, FolderOpenIcon, FolderClosedIcon } from 'lucide-react';

import MimeTypeIcon from '#web/components/icon/MimeTypeIcon';
import { Workbench } from '#domain/client/app/model/workbench';
import { isEntityMaterial, MaterialTypes, type MaterialVO } from '#domain/shared/model/material';
import { EntityTypes } from '#domain/shared/model/entity';
import type TreeNode from '#domain/client/common/model/abstract/TreeNode';
import MaterialService from '#domain/client/app/service/MaterialService';
import MenuButton from '#web/components/MenuButton';
import MaterialExplorer from '#domain/client/app/model/material/Explorer';

import ExplorerTreeView from '../common/ExplorerTree';
import useContextmenu from './useContextmenu';

const defaultIcon = (node: TreeNode<MaterialVO>) => {
  if (node.entity && isEntityMaterial(node.entity)) {
    return <MimeTypeIcon className="mr-1" size="1.2em" mimeType={node.entity.mimeType} />;
  }

  return node.isExpanded ? (
    <FolderOpenIcon size="1.3em" className="mr-1" />
  ) : (
    <FolderClosedIcon size="1.3em" className="mr-1" />
  );
};

// eslint-disable-next-line mobx/missing-observer
export default (function MaterialTreeView() {
  const {
    creation: { create },
  } = container.resolve(MaterialService);
  const { openEntity } = container.resolve(Workbench);
  const explorer = container.resolve(MaterialExplorer);

  const handleClick = (node: TreeNode<MaterialVO>, isMultiple: boolean) => {
    if (!isMultiple && node.entity) {
      if (isEntityMaterial(node.entity)) {
        openEntity({ entityType: EntityTypes.Material, entityId: node.id, mimeType: node.entity.mimeType });
      } else if (!node.isLeaf) {
        node.toggleExpand();
      }
    }
  };

  return (
    <ExplorerTreeView
      explorer={explorer}
      getContextmenuItems={useContextmenu()}
      onClick={handleClick}
      defaultIcon={defaultIcon}
      nodeOperation={(node) => (
        <MenuButton
          button={{
            size: 'tiny',
            variant: 'primary',
            icon: <PlusIcon />,
          }}
          menuItems={[
            { label: '创建目录', onSelect: () => create(node.id, MaterialTypes.Directory) },
            { label: '创建素材', onSelect: () => create(node.id, MaterialTypes.Entity) },
          ]}
        />
      )}
    />
  );
});
