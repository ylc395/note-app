import { observable, makeObservable } from 'mobx';
import last from 'lodash/last';

import ModelForm from './ModelForm';
import type { MaterialDTO } from 'interface/Material';
import type { CreatedFileVO } from 'interface/File';

export type MaterialsFormModel = Omit<MaterialDTO, 'fileId'>[];

export default class MaterialForm extends ModelForm<MaterialsFormModel> {
  @observable values: MaterialsFormModel;
  constructor(files: CreatedFileVO[]) {
    super();
    this.values = files.map(({ sourceUrl }) => ({
      name: last(sourceUrl.split('/'))?.split('.')[0] || '',
      comment: '',
      rating: 0,
      tags: [],
    }));
    makeObservable(this);
  }
}
