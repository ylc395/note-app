import { container } from 'tsyringe';
import { useEffect } from 'react';

import MaterialService from 'service/MaterialService';

import TreeView from '../../components/TreeView';
import { FileAddOutlined, FolderAddOutlined } from '@ant-design/icons';
import IconButton from 'web/components/IconButton';
import { isDirectory } from 'model/material';

// eslint-disable-next-line mobx/missing-observer
export default function MaterialTreeView() {
  const { loadChildren, materialTree, createDirectory, targetId } = container.resolve(MaterialService);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return (
    <TreeView
      tree={materialTree}
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
