import { container } from 'tsyringe';
import { useEffect } from 'react';
import { FileAddOutlined, FolderAddOutlined } from '@ant-design/icons';

import MaterialService from '@domain/service/MaterialService';
import { isDirectory } from '@domain/model/material';
import { EntityTypes } from '@domain/model/entity';
import IconButton from '@components/IconButton';

import TreeView from '../../components/TreeView';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialTreeView() {
  const { loadChildren, materialTree, createDirectory, targetId } = container.resolve(MaterialService);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <TreeView
      tree={materialTree}
      entityType={EntityTypes.Material}
      nodeOperation={(node) =>
        node.entity && isDirectory(node.entity) ? (
          <>
            <IconButton onClick={() => targetId.set(node.id)}>
              <FileAddOutlined />
            </IconButton>
            <IconButton onClick={() => createDirectory(node.id)}>
              <FolderAddOutlined />
            </IconButton>
          </>
        ) : null
      }
    />
  );
}
