import { observer } from 'mobx-react-lite';
import { useState, useContext } from 'react';
import { Button } from 'antd';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';

import FormModel from 'model/material/Form';
import MaterialService from 'service/MaterialService';

import Menu, { FormTypes } from './Menu';
import FileForm from './FileForm';
import TextForm from './TextForm';
import ctx from '../Context';

export default observer(function NewMaterial() {
  const { newMaterialModal } = useContext(ctx);
  const formModel = useCreation(() => new FormModel({}), []);
  const [formType, setFormType] = useState<FormTypes>(FormTypes.File);
  const { createMaterial } = container.resolve(MaterialService);

  const submit = async () => {
    await createMaterial(formModel);
    newMaterialModal.close();
  };

  return (
    <div className="flex">
      <Menu onSelect={setFormType} />
      <div>
        {formType === FormTypes.File && <FileForm model={formModel} />}
        {formType === FormTypes.Text && <TextForm model={formModel} />}
        <div>
          <Button onClick={submit}>保存</Button>
          <Button onClick={newMaterialModal.close}>取消</Button>
        </div>
      </div>
    </div>
  );
});
