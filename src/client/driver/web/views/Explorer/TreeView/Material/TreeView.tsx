import { container } from 'tsyringe';
import { PlusIcon, FolderOpenIcon, FolderClosedIcon } from 'lucide-react';
import { observer } from 'mobx-react-lite';

import MimeTypeIcon from '@web/components/icon/MimeTypeIcon';
import { Workbench } from '@domain/app/model/workbench';
import { isEntityMaterial, MaterialTypes, type MaterialVO } from '@shared/domain/model/material';
import { EntityTypes } from '@shared/domain/model/entity';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import MaterialService from '@domain/app/service/MaterialService';
import MenuButton from '@web/components/MenuButton';
import MaterialExplorer from '@domain/app/model/material/Explorer';

import TreeView from '../common/Tree';
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

export default observer(function MaterialTreeView() {
  const {
    move: { moveByItems: moveMaterialsByItems },
    creation: { create },
  } = container.resolve(MaterialService);
  const { openEntity } = container.resolve(Workbench);
  const {
    tree,
    dnd: { updateTreeForDropping, reset: resetTree },
    rename: { id: editingId, submit: submitEditing, cancel: cancelEditing },
  } = container.resolve(MaterialExplorer);

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
    <TreeView
      {...useContextmenu()}
      editingNodeId={editingId}
      onEditEnd={submitEditing}
      onEditCancel={cancelEditing}
      onDragStop={resetTree}
      onDragStart={updateTreeForDropping}
      onDrop={(item, node) => moveMaterialsByItems(node.id, item)}
      tree={tree}
      onClick={handleClick}
      defaultIcon={defaultIcon}
      nodeOperation={(node) => (
        <MenuButton
          button={{
            size: 'small',
            variant: 'primary',
            icon: <PlusIcon />,
          }}
          onSelect={(key) => create(node.id, key as MaterialTypes)}
          menuItems={[
            { label: '创建目录', key: MaterialTypes.Directory },
            { label: '创建素材', key: MaterialTypes.Entity },
          ]}
        />
      )}
    />
  );
});
