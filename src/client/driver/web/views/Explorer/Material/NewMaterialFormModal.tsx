import { observer } from 'mobx-react-lite';
import { string } from 'zod';
import assert from 'assert';
import { container } from 'tsyringe';
import { useRef } from 'react';

import type { EntityMaterialVO } from '@shared/domain/model/material';
import { fileDTOSchema } from '@shared/domain/model/file';
import Modal, { useModalValue } from '@web/components/Modal';
import { NEW_MATERIAL_MODAL } from '@domain/app/model/material/prompts';
import Form from '@domain/common/model/abstract/Form';
import { getHash } from '@shared/utils/file';
import MaterialService from '@domain/app/service/MaterialService';
import Field from '@web/components/form/Field';

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
        form.setError('file', {
          message: `该文件已存在对应素材${materials.map(({ title }) => title).join()}`,
          fatal: false,
        });
      }
    } else {
      form.set('file', null);
    }
  }

  return (
    <Modal {...modalProps} id={NEW_MATERIAL_MODAL} title="新建素材">
      {form && (
        <div className="flex flex-col">
          <Field
            type="text"
            ref={inputRef}
            label="名称"
            value={form.get('title')}
            onChange={(v) => form.set('title', v)}
          />
          <Field type="file" label="选择文件" onChange={handleFileChange} error={form.errors.file?.message} />
          <Field label="图标" type="icon" value={form.get('icon')} onChange={(icon) => form.set('icon', icon)} />
          <Field
            type="text"
            error={form.errors.sourceUrl?.message}
            label="来源 URL"
            value={form.get('sourceUrl') || ''}
            onChange={(e) => form.set('sourceUrl', e)}
          />
          <Field type="textarea" label="备注" value={form.get('comment')} onChange={(e) => form.set('comment', e)} />
        </div>
      )}
    </Modal>
  );
});
