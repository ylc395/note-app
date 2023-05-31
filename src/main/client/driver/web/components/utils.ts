import type { FormProps } from 'antd';
import { useCallback } from 'react';
import type { Dayjs } from 'dayjs';
import type Form from 'model/abstract/Form';

export function useUpdateTimeField<T extends object>(form: Form<T>, field: keyof T): (day: Dayjs | null) => void;
export function useUpdateTimeField(form: Form<never>, field: string): (day: Dayjs | null) => void;
export function useUpdateTimeField<T extends object>(
  form: Form<T>,
  field: string | keyof T,
): (day: Dayjs | null) => void {
  return useCallback((day) => day && form.updateValue(field as string, day.unix()), [field, form]);
}

export const FORM_ITEM_LAYOUT: FormProps = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};
