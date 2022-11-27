import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { BiPlus } from 'react-icons/bi';
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
        menu={[
          { node: 'item', name: '上传文件', onClick: select },
          { node: 'item', name: '上传目录' },
        ]}
      >
        <Button icon={<BiPlus />} />
      </Dropdown>
      <MaterialModalForm />
    </>
  );
});
