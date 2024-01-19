import { observer } from 'mobx-react-lite';
import { string } from 'zod';
import assert from 'assert';
import { container } from 'tsyringe';
import { useRef } from 'react';

import type { EntityMaterialVO } from '@shared/domain/model/material';
import { fileDTOSchema } from '@shared/domain/model/file';
import Modal, { useModalValue } from '@web/components/Modal';
import { NEW_MATERIAL_MODAL } from '@domain/app/model/material/modals';
import IconPicker from '@web/components/icon/PickerButton';
import Form from '@domain/common/model/abstract/Form';
import { getHash } from '@shared/utils/file';
import MaterialService from '@domain/app/service/MaterialService';

const createForm = () =>
  new Form({
    title: {
      initialValue: '',
      validate: (v) => !v && '标题不能为空',
    },
    icon: {
      initialValue: null as EntityMaterialVO['icon'],
    },
    sourceUrl: {
      initialValue: null,
      transform: (v) => v || null,
      validate: { schema: string().url().nullable(), message: '必须是一个 URL' },
    },
    comment: {
      initialValue: '',
    },
    file: {
      initialValue: null,
      validate: { schema: fileDTOSchema, message: '文件不得为空' },
    },
  });

export default observer(function NewMaterialFormModal() {
  const { value: form, modalProps } = useModalValue(createForm);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { queryMaterialByHash } = container.resolve(MaterialService);

  async function handleFileChange(files: FileList | null) {
    assert(form);

    if (files?.[0]) {
      const file = files[0];
      const data = await file.arrayBuffer();
      form.set('file', { mimeType: file.type, path: file.path, data });

      if (!form.get('title')) {
        form.set('title', file.name.replace(/\.[^/.]+$/, ''));
      }

      Promise.resolve().then(() => inputRef.current!.select());

      const hash = getHash(data);
      const materials = await queryMaterialByHash(hash);

      if (materials.length > 0) {
        form.setMessage('file', `该文件已存在对应素材${materials.map(({ title }) => title).join()}`);
      }
    } else {
      form.set('file', null);
    }
  }

  return (
    <Modal {...modalProps} id={NEW_MATERIAL_MODAL} title="新建素材">
      {form && (
        <div className="flex flex-col">
          <label className="flex">
            <span>名称</span>
            <input ref={inputRef} value={form.get('title')} onChange={(v) => form.set('title', v.target.value)} />
          </label>
          <label className="flex">
            <span>选择文件</span>
            <input type="file" onChange={(e) => handleFileChange(e.target.files)} />
            <span>{form.errors.file}</span>
          </label>
          <label className="flex">
            <span>图标</span>
            <IconPicker icon={form.get('icon') || null} onSelect={(icon) => form.set('icon', icon)} />
          </label>
          <label className="flex">
            <span>来源 URL</span>
            <input value={form.get('sourceUrl') || ''} onChange={(e) => form.set('sourceUrl', e.target.value)} />
            <span>{form.errors.sourceUrl}</span>
          </label>
          <label className="flex">
            <span>备注</span>
            <textarea value={form.get('comment')} onChange={(e) => form.set('comment', e.target.value)} />
          </label>
        </div>
      )}
    </Modal>
  );
});
