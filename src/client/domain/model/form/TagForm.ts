import { ref } from '@vue/reactivity';
import ModelForm from './ModelForm';
import type { TagDTO } from 'interface/Tag';

export type TagFormModel = Pick<TagDTO, 'name'>;

export default class TagForm extends ModelForm<TagFormModel> {
  values = ref({
    name: '',
  });
}
