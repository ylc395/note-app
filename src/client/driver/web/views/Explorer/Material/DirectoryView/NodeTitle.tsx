import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';
import { useContext } from 'react';

import type { MaterialTreeNode } from 'model/material/Tree';
import MaterialService from 'service/MaterialService';

import IconTitle from 'web/components/IconTitle';
import { ModalContext } from '../useModals';
import { isDirectory } from 'interface/material';

export default observer(function Title({ node }: { node: MaterialTreeNode }) {
  const { createDirectory } = container.resolve(MaterialService);
  const { creatingModal } = useContext(ModalContext);

  return (
    <span className="group flex">
      <IconTitle
        icon={node.entity.icon}
        title={`${__ENV__ === 'dev' ? `${node.key.slice(0, 3)} ` : ''}${node.title}`}
      />
      {isDirectory(node.entity) && (
        <>
          <Tooltip title="新建素材" placement="right">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                creatingModal.open({ parentId: node.entity.id });
              }}
              className="invisible ml-auto mr-2 group-hover:visible"
              size="small"
              type="text"
              icon={<PlusOutlined />}
            />
          </Tooltip>
          <Tooltip title="新建目录" placement="right">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                createDirectory(node.key);
              }}
              className="invisible ml-auto mr-2 group-hover:visible"
              size="small"
              type="text"
              icon={<PlusOutlined />}
            />
          </Tooltip>
        </>
      )}
    </span>
  );
});
