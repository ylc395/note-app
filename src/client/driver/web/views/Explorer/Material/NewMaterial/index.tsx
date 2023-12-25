import { useState } from 'react';
import { Button } from 'antd';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';
import { observer } from 'mobx-react-lite';

import FormModel from '@domain/app/model/material/Form';
import MaterialService from '@domain/app/service/MaterialService';

import Menu, { FormTypes } from './Menu';
import FileForm from './FileForm';
import TextForm from './TextForm';

export default observer(function NewMaterial() {
  const formModel = useCreation(() => new FormModel({}), []);
  const [formType, setFormType] = useState<FormTypes>(FormTypes.File);
  const { createMaterial } = container.resolve(MaterialService);

  const submit = async () => {
    await createMaterial(formModel);
  };

  return (
    <div className="flex">
      <Menu onSelect={setFormType} />
      <div>
        {formType === FormTypes.File && <FileForm model={formModel} />}
        {formType === FormTypes.Text && <TextForm model={formModel} />}
        <div>
          <Button onClick={submit}>保存</Button>
          <Button>取消</Button>
        </div>
      </div>
    </div>
  );
});
