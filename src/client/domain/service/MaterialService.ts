import { container, singleton } from 'tsyringe';
import { shallowRef } from '@vue/reactivity';
import { watch } from '@vue-reactivity/watch';
import last from 'lodash/last';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO } from 'interface/Material';
import type { FileDTO, FileVO } from 'interface/File';
import { TagTypes } from 'interface/Tag';
import TagTree from 'model/TagTree';
import type { MaterialsFormModel } from 'model/form/MaterialForm';

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly files = shallowRef<FileVO[]>([]);
  readonly tagTree = new TagTree(TagTypes.Material);

  constructor() {
    watch(this.tagTree.selectedTag, this.#queryMaterials);
  }

  readonly uploadFiles = async (files: FileDTO[]) => {
    const { body: createdFiles } = await this.#remote.post<FileDTO[], FileVO[]>('/files', files);

    this.files.value = createdFiles.map((file) => ({
      ...file,
      sourceUrl: last(file.sourceUrl.split('/')) || '',
    }));
  };

  readonly clearFiles = () => {
    this.files.value = [];
  };

  readonly uploadMaterials = async (materials: MaterialsFormModel) => {
    await this.#remote.post<MaterialDTO[], MaterialVO[]>(
      '/materials',
      materials.map((v, i) => ({
        ...v,
        fileId: this.files.value[i].id,
      })),
    );
    this.files.value = [];
  };

  readonly #queryMaterials = () => {
    if (!this.tagTree.selectedTag.value) {
      return;
    }
  };
}
