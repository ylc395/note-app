import { container } from 'tsyringe';
import { AiOutlineFolder, AiOutlineFolderOpen, AiOutlineFile } from 'react-icons/ai';
import { FaRegFileAudio, FaRegFileVideo } from 'react-icons/fa6';
import { observer } from 'mobx-react-lite';

import { Workbench } from '@domain/app/model/workbench';
import { isEntityMaterial, type MaterialVO } from '@shared/domain/model/material';
import { EntityTypes } from '@shared/domain/model/entity';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import MaterialExplorer from '@domain/app/model/material/Explorer';
import MaterialService from '@domain/app/service/MaterialService';
import Button from '@web/components/Button';

import TreeView from '../components/TreeView';

export default observer(function MaterialTreeView() {
  const { openEntity } = container.resolve(Workbench);
  const {
    tree,
    showContextmenu,
    updateTreeForDropping,
    editingId,
    submitEditing,
    cancelEditing,
    reset: resetTree,
  } = container.resolve(MaterialExplorer);
  const { createMaterial } = container.resolve(MaterialService);

  const handleClick = (node: TreeNode<MaterialVO>, isMultiple: boolean) => {
    if (!isMultiple && node.entity && !isEntityMaterial(node.entity)) {
      openEntity({ entityType: EntityTypes.Material, entityId: node.id });
    }
  };

  const defaultIcon = (node: TreeNode<MaterialVO>) => {
    if (node.entity && isEntityMaterial(node.entity)) {
      if (node.entity.mimeType.includes('audio')) {
        return <FaRegFileAudio />;
      }

      if (node.entity.mimeType.includes('video')) {
        return <FaRegFileVideo />;
      }

      return <AiOutlineFile />;
    }

    return node.isExpanded ? (
      <AiOutlineFolderOpen size="1.3em" className="mr-1" />
    ) : (
      <AiOutlineFolder size="1.3em" className="mr-1" />
    );
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
