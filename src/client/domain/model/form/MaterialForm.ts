import { observable, makeObservable } from 'mobx';
import last from 'lodash/last';

import ModelForm from './ModelForm';
import type { MaterialDTO } from 'interface/Material';
import type { FileVO } from 'interface/File';

export type MaterialsFormModel = MaterialDTO[];

export default class MaterialForm extends ModelForm<MaterialsFormModel> {
  @observable values: MaterialsFormModel;
  constructor(files: FileVO[]) {
    super();
    this.values = files.map(({ sourceUrl, id }) => ({
      name: last(sourceUrl.split('/'))?.split('.')[0] || '',
      comment: '',
      rating: 0,
      tags: [],
      fileId: id,
    }));
    makeObservable(this);
  }
}
