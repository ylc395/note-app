import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { IconPlusStroked } from '@douyinfe/semi-icons';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import useFiles from 'web/hooks/useFiles';
import MaterialModalForm from './MaterialModalForm';

export default observer(function AddMenu() {
  const { uploadFiles } = container.resolve(MaterialService);
  const { select, files } = useFiles();

  useEffect(() => {
    uploadFiles(files);
  }, [files]);

  return (
    <>
      <Dropdown
        trigger="click"
        position="bottomRight"
        clickToHide
        render={
          <Dropdown.Menu>
            <Dropdown.Item onClick={select}>上传文件</Dropdown.Item>
            <Dropdown.Item>上传目录</Dropdown.Item>
          </Dropdown.Menu>
        }
      >
        <Button icon={<IconPlusStroked />} />
      </Dropdown>
      <MaterialModalForm />
    </>
  );
});
