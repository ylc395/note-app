import { container } from 'tsyringe';
import { useEffect } from 'react';

import MaterialService from 'service/MaterialService';

import TreeView from '../../components/TreeView';
import { EntityTypes } from 'model/entity';
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
    <div className="scrollbar-stable min-h-0 grow overflow-y-auto">
      <div className="h-full">
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
      </div>
    </div>
  );
}
