import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';
import { useContext } from 'react';

import type { MaterialTreeNode } from 'model/material/Tree';
import MaterialService from 'service/MaterialService';
import { isDirectory } from 'interface/material';
import { IS_DEV } from 'infra/constants';

import IconTitle from 'web/components/IconTitle';
import ctx from '../Context';

export default observer(function Title({ node }: { node: MaterialTreeNode }) {
  const { createDirectory } = container.resolve(MaterialService);
  const { newMaterialModal, setCurrentMaterialId } = useContext(ctx);

  return (
    <span className="group flex">
      <IconTitle icon={node.entity.icon} title={`${IS_DEV ? `${node.key.slice(0, 3)} ` : ''}${node.title}`} />
      {isDirectory(node.entity) && (
        <>
          <Tooltip title="新建素材" placement="right">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMaterialId(node.entity.id);
                newMaterialModal.open();
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
