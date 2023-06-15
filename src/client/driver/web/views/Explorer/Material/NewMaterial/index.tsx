import { observer } from 'mobx-react-lite';
import { useState, useCallback, useContext } from 'react';
import { Button } from 'antd';
import { container } from 'tsyringe';

import FileFormModel from 'model/material/FileForm';
import TextFormModel from 'model/material/TextForm';
import MaterialService from 'service/MaterialService';

import Menu, { FormTypes } from './Menu';
import FileForm from './FileForm';
import TextForm from './TextForm';
import ctx from '../Context';

export default observer(function NewMaterial() {
  const { newMaterialModal, currentMaterialId } = useContext(ctx);
  const [formModel, setFormModel] = useState(() => new FileFormModel({}));
  const { createMaterial } = container.resolve(MaterialService);
  const handleTypeSelect = useCallback((type: FormTypes) => {
    setFormModel(type === FormTypes.File ? new FileFormModel({}) : new TextFormModel({}));
  }, []);

  const submit = useCallback(async () => {
    const data = await formModel.validate();

    if (!data) {
      return;
    }

    if (!currentMaterialId) {
      throw new Error('no data');
    }

    await createMaterial({ ...data, parentId: currentMaterialId });
    newMaterialModal.close();
  }, [createMaterial, currentMaterialId, formModel, newMaterialModal]);

  return (
    <div className="flex">
      <Menu onSelect={handleTypeSelect} />
      <div>
        {formModel instanceof FileFormModel && <FileForm model={formModel} />}
        {formModel instanceof TextFormModel && <TextForm model={formModel} />}
        <div>
          <Button onClick={submit}>保存</Button>
          <Button onClick={newMaterialModal.close}>取消</Button>
        </div>
      </div>
    </div>
  );
});
