import ModelForm from './ModelForm';
import { type TagDTO, tagDTOSchema } from 'interface/Tag';

export type TagFormModel = Pick<TagDTO, 'name'>;

const initialValues = () => ({ name: '' });

export default class TagForm extends ModelForm<TagFormModel> {
  protected schema = tagDTOSchema.pick({ name: true });
  constructor() {
    super(initialValues);
  }
}
