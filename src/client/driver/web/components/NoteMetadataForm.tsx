import { observer } from 'mobx-react-lite';
import { useCallback, useState, MouseEvent } from 'react';
import { Form, DatePicker, Button, Checkbox, Popover } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import dayjs from 'dayjs';

import NoteMetadata from 'model/form/NoteMetadata';
import type { NoteMetadata as NoteMetadataValues } from 'model/form/type';

import { useUpdateTimeField, FORM_ITEM_LAYOUT } from './utils';
import { EmojiPicker, Emoji } from './Emoji';

interface Props {
  onSubmit: (metadata: NoteMetadataValues) => void;
  onCancel: () => void;
  metadata: NoteMetadataValues;
}

export default observer(function NoteMetadataEditor({ onSubmit, onCancel, metadata }: Props) {
  const [noteMetadata] = useState(() => {
    return new NoteMetadata(metadata);
  });

  const [isPickingEmoji, setIsPickingEmoji] = useState(false);

  const handleUserCreatedAt = useUpdateTimeField(noteMetadata, 'userCreatedAt');
  const handleUserUpdatedAt = useUpdateTimeField(noteMetadata, 'userUpdatedAt');
  const handleIsReadonly = useCallback(
    (e: CheckboxChangeEvent) => noteMetadata.updateValue('isReadonly', e.target.checked),
    [noteMetadata],
  );
  const handleEmojiSelect = useCallback(
    (id: string) => {
      noteMetadata.updateValue('icon', `emoji:${id}`);
      setIsPickingEmoji(false);
    },
    [noteMetadata],
  );

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    setIsPickingEmoji(!isPickingEmoji);
  };

  return (
    <div className="mt-4">
      <Form {...FORM_ITEM_LAYOUT}>
        <Form.Item label="图标">
          <div className="flex items-center">
            <Emoji id={noteMetadata.values.icon} className="mr-4" />
            <Popover
              trigger="click"
              open={isPickingEmoji}
              content={() => (
                <EmojiPicker onSelect={handleEmojiSelect} onClickOutside={() => setIsPickingEmoji(false)} />
              )}
            >
              <Button size="small" onClick={handleClick}>
                选择 emoji
              </Button>
            </Popover>
            {noteMetadata.values.icon && (
              <Button size="small" className="ml-2" onClick={() => noteMetadata.updateValue('icon', null)}>
                清除
              </Button>
            )}
          </div>
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
