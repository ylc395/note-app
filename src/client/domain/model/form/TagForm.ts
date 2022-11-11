import { observable, makeObservable } from 'mobx';
import ModelForm from './ModelForm';
import type { TagDTO } from 'interface/Tag';

export type TagFormModel = Pick<TagDTO, 'name'>;

export default class TagForm extends ModelForm<TagFormModel> {
  constructor() {
    super();
    makeObservable(this);
  }

  @observable values = {
    name: '',
  };
}
