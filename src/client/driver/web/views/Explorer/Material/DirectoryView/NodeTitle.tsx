import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';

import type { MaterialTreeNode } from 'model/material/Tree';
import MaterialService from 'service/MaterialService';

import IconTitle from 'web/components/IconTitle';

export default observer(function Title({ node }: { node: MaterialTreeNode }) {
  const { createDirectory } = container.resolve(MaterialService);

  return (
    <span className="group flex">
      <IconTitle icon={node.entity.icon} title={`${__ENV__ === 'dev' ? `${node.key} ` : ''}${node.title}`} />
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
    </span>
  );
});
