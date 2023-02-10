import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { Input, Form, DatePicker, Button, Checkbox } from 'antd';
import dayjs from 'dayjs';

import NoteMetadata from 'model/form/NoteMetadata';
import type { NoteMetadata as NoteMetadataValues } from 'model/form/type';

import { useUpdateTimeField, FORM_ITEM_LAYOUT } from './utils';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

interface Props {
  onSubmit: (metadata: NoteMetadataValues) => void;
  onCancel: () => void;
  metadata: NoteMetadataValues;
}

export default observer(function NoteMetadataEditor({ onSubmit, onCancel, metadata }: Props) {
  const [noteMetadata] = useState(() => {
    return new NoteMetadata(metadata);
  });

  const handleUserCreatedAt = useUpdateTimeField(noteMetadata, 'userCreatedAt');
  const handleUserUpdatedAt = useUpdateTimeField(noteMetadata, 'userUpdatedAt');
  const handleIsReadonly = useCallback(
    (e: CheckboxChangeEvent) => noteMetadata.updateValue('isReadonly', e.target.checked),
    [noteMetadata],
  );

  return (
    <div className="mt-4">
      <Form {...FORM_ITEM_LAYOUT}>
        <Form.Item label="图标">
          <Input />
        </Form.Item>
        <Form.Item label="只读">
          <Checkbox
            indeterminate={noteMetadata.values.isReadonly === undefined}
            checked={noteMetadata.values.isReadonly}
            onChange={handleIsReadonly}
          />
        </Form.Item>
        {noteMetadata.values.userCreatedAt && (
          <Form.Item label="创建日期">
            <DatePicker value={dayjs.unix(noteMetadata.values.userCreatedAt)} showTime onChange={handleUserCreatedAt} />
          </Form.Item>
        )}
        {noteMetadata.values.userUpdatedAt && (
          <Form.Item label="更新日期">
            <DatePicker value={dayjs.unix(noteMetadata.values.userUpdatedAt)} showTime onChange={handleUserUpdatedAt} />
          </Form.Item>
        )}
      </Form>
      <div className="text-right mt-8">
        <Button onClick={onCancel} className="mr-4">
          取消
        </Button>
        <Button type="primary" disabled={!noteMetadata.isValid} onClick={() => noteMetadata.validate(onSubmit)}>
          保存
        </Button>
      </div>
    </div>
  );
});
