import ModelForm from './ModelForm';
import type { TagDTO } from 'interface/Tag';

export type TagFormModel = Pick<TagDTO, 'name'>;

const initialValues = () => ({ name: '' });

export default class TagForm extends ModelForm<TagFormModel> {
  constructor() {
    super(initialValues);
  }
}
