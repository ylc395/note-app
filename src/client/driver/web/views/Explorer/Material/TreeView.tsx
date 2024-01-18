import { container } from 'tsyringe';
import { AiOutlineFolder, AiOutlineFolderOpen } from 'react-icons/ai';
import { observer } from 'mobx-react-lite';

import MimeTypeIcon from '@web/components/icon/MimeTypeIcon';
import { Workbench } from '@domain/app/model/workbench';
import { isEntityMaterial, type MaterialVO } from '@shared/domain/model/material';
import { EntityTypes } from '@shared/domain/model/entity';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import MaterialExplorer from '@domain/app/model/material/Explorer';

import TreeView from '../common/TreeView';

const defaultIcon = (node: TreeNode<MaterialVO>) => {
  if (node.entity && isEntityMaterial(node.entity)) {
    return <MimeTypeIcon className="mr-1" size="1.2em" mimeType={node.entity.mimeType} />;
  }

  return node.isExpanded ? (
    <AiOutlineFolderOpen size="1.3em" className="mr-1" />
  ) : (
    <AiOutlineFolder size="1.3em" className="mr-1" />
  );
};

export default observer(function MaterialTreeView() {
  const { openEntity } = container.resolve(Workbench);
  const {
    tree,
    showContextmenu,
    updateTreeForDropping,
    editingId,
    submitRenaming: submitEditing,
    cancelRenaming: cancelEditing,
    reset: resetTree,
  } = container.resolve(MaterialExplorer);

  const handleClick = (node: TreeNode<MaterialVO>, isMultiple: boolean) => {
    if (!isMultiple && node.entity && isEntityMaterial(node.entity)) {
      openEntity({ entityType: EntityTypes.Material, entityId: node.id, mimeType: node.entity.mimeType });
    }
  };

  return (
    <TreeView
      editingNodeId={editingId}
      onEditEnd={submitEditing}
      onEditCancel={cancelEditing}
      onContextmenu={showContextmenu}
      onDragStop={resetTree}
      onDragStart={updateTreeForDropping}
      onDrop={() => null}
      tree={tree}
      onClick={handleClick}
      defaultIcon={defaultIcon}
      nodeOperation={() => null}
    />
  );
});
