import { observer, useLocalObservable } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useState, useEffect, type MouseEvent } from 'react';
import { Form, DatePicker, Button, Checkbox, Popover, AutoComplete } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import dayjs from 'dayjs';
import uniq from 'lodash/uniq';
import uniqueId from 'lodash/uniqueId';

import { token as remoteToken } from 'infra/Remote';
import NoteMetadata from 'model/form/NoteMetadata';
import { type NoteMetadata as NoteMetadataValues, MULTIPLE_ICON_FLAG } from 'model/form/type';
import type { NoteAttributesVO, NoteDTO, NoteVO } from 'interface/Note';

import { useUpdateTimeField, FORM_ITEM_LAYOUT } from '../utils';
import { EmojiPicker, Emoji } from '../Emoji';
import { computed, observable } from 'mobx';

interface Props {
  onSubmit: (metadata: NoteMetadataValues) => void;
  onCancel: () => void;
  metadata: NoteMetadataValues;
  icons: NoteVO['icon'][];
}

function useAttributes(noteMetadata: NoteMetadata) {
  const remote = container.resolve(remoteToken);
  const [allAttributes] = useState(() => observable.box<NoteAttributesVO>());

  const fetchAllAttributes = useCallback(() => {
    remote.get<void, NoteAttributesVO>('/notes/attributes').then(({ body }) => {
      allAttributes.set(body);
    });
  }, [allAttributes, remote]);

  useEffect(() => {
    if (Object.keys(noteMetadata.values.attributes || {}).length > 0) {
      fetchAllAttributes();
    }
  }, [allAttributes, fetchAllAttributes, noteMetadata, remote]);

  const attributes = useLocalObservable(
    () => ({
      fields: Object.entries(noteMetadata.values.attributes || {}).map(([key, value]) => ({
        key,
        value,
        keyError: '',
        valueError: '',
        id: uniqueId('field-'),
      })),
      append() {
        if (!allAttributes.get()) {
          fetchAllAttributes();
        }
        this.fields.push({
          key: '',
          value: '',
          keyError: '请填入属性名',
          valueError: '请填入属性值',
          id: uniqueId('field-'),
        });
      },
      rename(index: number, key: string) {
        const attribute = this.fields[index];

        if (!attribute) {
          throw new Error('wrong index');
        }

        const allKeys = this.fields.map(({ key }) => key);

        let keyError = '';

        if (key.length === 0) {
          keyError = '请填入属性名';
        } else if (allKeys.includes(key)) {
          keyError = '属性名不能重复';
        }

        attribute.key = key;
        attribute.keyError = keyError;
      },
      updateValue(index: number, value: string) {
        const attribute = this.fields[index];

        if (!attribute) {
          throw new Error('wrong index');
        }

        attribute.value = value;
        attribute.valueError = value.length > 0 ? '' : '请填入属性值';
      },
      remove(index: number) {
        const key = this.fields[index];

        if (!key) {
          throw new Error('wrong index');
        }

        this.fields.splice(index, 1);
      },
      get areValid() {
        return this.fields.every(({ keyError, valueError }) => !keyError && !valueError);
      },
    }),
    { areValid: computed },
  );

  const availableKeys = computed(() => {
    return Object.keys(allAttributes.get() || {}).filter(
      (key) => !attributes.fields.find((field) => field.key === key),
    );
  });

  return { allAttributes, attributes, availableKeys };
}

export default observer(function MetadataForm({ onSubmit, onCancel, metadata, icons }: Props) {
  const [noteMetadata] = useState(() => {
    return new NoteMetadata(metadata);
  });

  const [isPickingEmoji, setIsPickingEmoji] = useState(false);
  const { allAttributes, attributes, availableKeys } = useAttributes(noteMetadata);

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

  const handleEmojiClick = (e: MouseEvent) => {
    e.stopPropagation();
    setIsPickingEmoji(!isPickingEmoji);
  };

  const handleSubmit = useCallback(() => {
    if (!attributes.areValid) {
      return;
    }

    noteMetadata.values.attributes = attributes.fields.reduce((result, { key, value }) => {
      result[key] = value;
      return result;
    }, {} as NonNullable<NoteDTO['attributes']>);

    noteMetadata.validate(onSubmit);
  }, [attributes, noteMetadata, onSubmit]);

  const uniqIcons = uniq(icons);
  const showClear = noteMetadata.values.icon || uniqIcons.length > 0;

  return (
    <div className="mt-4">
      <Form {...FORM_ITEM_LAYOUT}>
        <Form.Item label="图标">
          <div className="flex items-center">
            {noteMetadata.values.icon === MULTIPLE_ICON_FLAG && uniqIcons.length === 1 && (
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              <Emoji id={uniqIcons[0]!} className="mr-4" />
            )}
            {noteMetadata.values.icon !== MULTIPLE_ICON_FLAG && (
              <Emoji id={noteMetadata.values.icon} className="mr-4" />
            )}
            <Popover
              trigger="click"
              open={isPickingEmoji}
              content={() => (
                <EmojiPicker onSelect={handleEmojiSelect} onClickOutside={() => setIsPickingEmoji(false)} />
              )}
            >
              <Button size="small" onClick={handleEmojiClick}>
                选择 emoji
              </Button>
            </Popover>
            {showClear && (
              <Button size="small" className="ml-2" onClick={() => noteMetadata.updateValue('icon', null)}>
                清除
              </Button>
            )}
          </div>
        </Form.Item>
        <Form.Item label="只读">
          <Checkbox
            indeterminate={noteMetadata.values.isReadonly === 2}
            checked={Boolean(noteMetadata.values.isReadonly)}
            onChange={handleIsReadonly}
          />
        </Form.Item>
        {noteMetadata.values.userCreatedAt && (
          <Form.Item label="创建日期">
            <DatePicker
              allowClear={false}
              value={dayjs.unix(noteMetadata.values.userCreatedAt)}
              showTime
              onChange={handleUserCreatedAt}
            />
          </Form.Item>
        )}
        {noteMetadata.values.userUpdatedAt && (
          <Form.Item label="更新日期">
            <DatePicker
              allowClear={false}
              value={dayjs.unix(noteMetadata.values.userUpdatedAt)}
              showTime
              onChange={handleUserUpdatedAt}
            />
          </Form.Item>
        )}
        {noteMetadata.values.attributes && (
          <Form.Item label="自定义属性">
            {attributes.fields.map(({ key, value, id, keyError, valueError }, i) => {
              return (
                <div key={id} className="flex mb-4">
                  <div className="flex flex-col w-2/5 mr-2">
                    <AutoComplete
                      onChange={(e) => attributes.rename(i, e)}
                      value={key}
                      placeholder="输入或选择"
                      options={availableKeys.get().map((str) => ({ label: str, value: str }))}
                    />
                    <span className="text-red-500">{keyError}</span>
                  </div>
                  <div className="flex flex-col w-2/5">
                    <AutoComplete
                      placeholder="输入或选择"
                      onChange={(e) => attributes.updateValue(i, e)}
                      value={value}
                      options={allAttributes.get()?.[key]?.map((v) => ({ label: v, value: v }))}
                    />
                    <span className="text-red-500">{valueError}</span>
                  </div>
                  <Button onClick={() => attributes.remove(i)} type="text" icon={<DeleteOutlined />} />
                </div>
              );
            })}
            <Button onClick={() => attributes.append()}>新增自定义属性</Button>
          </Form.Item>
        )}
      </Form>
      <div className="text-right mt-8">
        <Button onClick={onCancel} className="mr-4">
          取消
        </Button>
        <Button type="primary" disabled={!noteMetadata.isValid || !attributes.areValid} onClick={handleSubmit}>
          保存
        </Button>
      </div>
    </div>
  );
});
