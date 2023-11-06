import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';

import type { MaterialTreeNode } from 'model/material/Tree';
import MaterialService from 'service/MaterialService';
import { IS_DEV } from 'infra/constants';

import IconTitle from 'web/components/IconTitle';

export default observer(function Title({ node }: { node: MaterialTreeNode }) {
  const { createDirectory, isDirectory, targetId } = container.resolve(MaterialService);

  return (
    <span className="group flex">
      <IconTitle icon={node.attributes?.icon} title={`${IS_DEV ? `${node.id.slice(0, 3)} ` : ''}${node.title}`} />
      {isDirectory(node.id) && (
        <>
          <Tooltip title="新建素材" placement="right">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                targetId.set(node.id);
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
                createDirectory(node.id);
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