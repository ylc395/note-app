import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useRef } from 'react';

import Modal from '@web/components/Modal';
import MaterialService from '@domain/app/service/MaterialService';
import Field from '@web/components/form/Field';

export default observer(function NewMaterialFormModal() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    creation: { form, submit, stopCreating, handleFileChange },
  } = container.resolve(MaterialService);

  if (!form) {
    return null;
  }

  const _handleFileChange = async (files: FileList | null) => {
    await handleFileChange(files);
    const file = form.get('file');

    if (file) {
      inputRef.current?.select();
    }
  };

  return (
    <Modal onConfirm={submit} onCancel={stopCreating} title="新建素材">
      <div className="flex flex-col">
        <Field
          type="text"
          ref={inputRef}
          label="名称"
          value={form.get('title')}
          onChange={form.set.bind(form, 'title')}
        />
        <Field type="file" label="选择文件" onChange={_handleFileChange} error={form.errors.file?.message} />
        <Field label="图标" type="icon" value={form.get('icon')} onChange={form.set.bind(form, 'icon')} />
        <Field
          type="text"
          error={form.errors.sourceUrl?.message}
          label="来源 URL"
          value={form.get('sourceUrl') || ''}
          onChange={form.set.bind(form, 'sourceUrl')}
        />
        <Field type="textarea" label="备注" value={form.get('comment')} onChange={form.set.bind(form, 'comment')} />
      </div>
    </Modal>
  );
});
