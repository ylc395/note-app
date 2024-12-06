import { container } from '#domain/shared/infra/singletons';
import { FolderOpenIcon, FolderClosedIcon } from 'lucide-react';

import MimeTypeIcon from '#web/components/icon/MimeTypeIcon';
import Workbench from '#domain/client/app/model/workbench/Workbench';
import { isEntityMaterial, type MaterialVO } from '#domain/shared/model/material';
import type TreeNode from '#domain/client/shared/model/abstract/TreeNode';
import MaterialExplorer from '#domain/client/app/model/material/Explorer';

import ExplorerTreeView from '../common/ExplorerTree';

const defaultIcon = (node: TreeNode<MaterialVO>) => {
  if (node.value && isEntityMaterial(node.value)) {
    return <MimeTypeIcon className="mr-1" size="1.2em" mimeType={node.value.file.mimeType} />;
  }

  return node.isExpanded ? (
    <FolderOpenIcon size="1.3em" className="mr-1" />
  ) : (
    <FolderClosedIcon size="1.3em" className="mr-1" />
  );
};

// eslint-disable-next-line mobx/missing-observer
export default (function MaterialTreeView() {
  const { openEntity } = container.resolve(Workbench);
  const explorer = container.resolve(MaterialExplorer);

  const handleClick = (node: TreeNode<MaterialVO>) => {
    if (node.entityLocator?.mimeType) {
      openEntity(node.entityLocator);
    } else {
      node.toggleExpand();
    }
  };

  return <ExplorerTreeView onClick={handleClick} explorer={explorer} defaultIcon={defaultIcon} />;
});
