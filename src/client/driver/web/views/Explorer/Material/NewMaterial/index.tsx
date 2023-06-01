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
import { ModalContext } from '../useModals';

export default observer(function NewMaterial() {
  const { creatingModal } = useContext(ModalContext);
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

    const parentId = creatingModal.getData()?.parentId;

    if (!parentId) {
      throw new Error('no data');
    }

    await createMaterial({ ...data, parentId });
    creatingModal.close();
  }, [createMaterial, creatingModal, formModel]);

  return (
    <div className="flex">
      <Menu onSelect={handleTypeSelect} />
      <div>
        {formModel instanceof FileFormModel && <FileForm model={formModel} />}
        {formModel instanceof TextFormModel && <TextForm model={formModel} />}
        <div>
          <Button onClick={submit}>保存</Button>
          <Button onClick={creatingModal.close}>取消</Button>
        </div>
      </div>
    </div>
  );
});
