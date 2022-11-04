import ModelForm from './ModelForm';
import { type TagDTO, tagSchema } from 'interface/Tag';
import { pick } from 'superstruct';

export type TagFormModel = Pick<TagDTO, 'name'>;

const initialValues = () => ({ name: '' });

export default class TagForm extends ModelForm<TagFormModel> {
  protected schema = pick(tagSchema, ['name']);
  constructor() {
    super(initialValues);
  }
}
