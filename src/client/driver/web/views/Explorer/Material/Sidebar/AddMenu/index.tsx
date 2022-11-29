import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dropdown, type MenuProps } from 'antd';
import { BiPlus } from 'react-icons/bi';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import useFiles, { type Action } from 'web/hooks/useFiles';
import MaterialModalForm from './MaterialModalForm';

export default observer(function AddMenu() {
  const { uploadFiles } = container.resolve(MaterialService);
  const { select, files } = useFiles();

  const items: MenuProps['items'] = [
    { label: '上传文件', key: 'file' },
    { label: '上传目录', key: 'dir' },
  ];

  useEffect(() => {
    uploadFiles(files);
  }, [files]);

  return (
    <>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items, onClick: ({ key }) => select(key as Action) }}
      >
        <Button icon={<BiPlus />} />
      </Dropdown>
      <MaterialModalForm />
    </>
  );
});
