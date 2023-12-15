import { container } from 'tsyringe';
import { useEffect } from 'react';

import MaterialService from '@domain/service/MaterialService';
import { isDirectory } from '@domain/model/material';

import TreeView from '../../components/TreeView';
import AddButton from '../AddButton';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialTreeView() {
  const { loadChildren, materialTree } = container.resolve(MaterialService);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <TreeView
      tree={materialTree}
      nodeOperation={(node) => node.entity && isDirectory(node.entity) && <AddButton materialId={node.id} />}
    />
  );
}
