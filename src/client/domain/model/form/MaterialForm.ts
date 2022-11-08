import { ref, type Ref } from '@vue/reactivity';
import last from 'lodash/last';

import ModelForm from './ModelForm';
import type { MaterialDTO } from 'interface/Material';
import type { FileVO } from 'interface/File';

export type MaterialsFormModel = Omit<MaterialDTO, 'fileId'>[];

export default class MaterialForm extends ModelForm<MaterialsFormModel> {
  values: Ref<MaterialsFormModel>;
  constructor(files: FileVO[]) {
    super();
    this.values = ref(
      files.map(({ sourceUrl }) => ({
        name: last(sourceUrl.split('/'))?.split('.')[0] || '',
        comment: '',
        rating: 0,
        tags: [],
      })),
    );
  }
}
