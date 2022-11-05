import { array } from 'zod';
import type { Ref } from '@vue/reactivity';
import ModelForm from './ModelForm';
import { type MaterialDTO, materialDTOSchema } from 'interface/Material';
import type { FileVO } from 'interface/File';

export type MaterialsFormModel = Omit<MaterialDTO, 'fileId'>[];

export default class TagForm extends ModelForm<MaterialsFormModel> {
  protected schema = array(materialDTOSchema.omit({ fileId: true }));
  constructor(files: Ref<FileVO[]>) {
    const initialValues = () =>
      files.value.map(({ sourceUrl }) => ({
        name: sourceUrl.split('.')[0],
        comment: '',
        rating: 0,
        tags: [],
      }));

    super(initialValues);
  }
}
