import { useCreation } from 'ahooks';
import { uniqueId } from 'lodash-es';
import { type Ref, forwardRef } from 'react';

import IconPicker from '../icon/PickerButton';
import clsx from 'clsx';

interface BaseProps<T> {
  value?: T;
  label: string;
  error?: string;
  onChange: (value: T) => void;
}

interface TextProps extends BaseProps<string> {
  value: string;
  type: 'textarea' | 'text';
}

interface IconProps extends BaseProps<string | null> {
  value: string | null;
  type: 'icon';
}

interface FileProps extends BaseProps<FileList | null> {
  type: 'file';
}

type Props = TextProps | IconProps | FileProps;

export default forwardRef<{ select(): void }, Props>(function Field({ label, type, error, value, onChange }, ref) {
  const id = useCreation(() => uniqueId('formField-'), []);

  return (
    <div className={clsx('mb-8 flex', type === 'textarea' ? 'items-start' : 'items-center')}>
      <label htmlFor={id} className="mr-2 w-1/5 text-right">
        {label}
      </label>
      <div className="relative">
        {type === 'text' && (
          <input
            className="h-6"
            id={id}
            onChange={(e) => onChange(e.target.value)}
            value={value}
            ref={ref as Ref<HTMLInputElement>}
          />
        )}
        {type === 'textarea' && (
          <textarea
            id={id}
            onChange={(e) => onChange(e.target.value)}
            value={value}
            ref={ref as Ref<HTMLTextAreaElement>}
          />
        )}
        {type === 'icon' && <IconPicker onSelect={onChange} icon={value} />}
        {type === 'file' && <input type="file" onChange={(e) => onChange(e.target.files)} />}
        {error && <div className="absolute text-sm">{error}</div>}
      </div>
    </div>
  );
});
