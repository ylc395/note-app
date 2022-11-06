import { container, singleton } from 'tsyringe';
import { shallowRef } from '@vue/reactivity';
import last from 'lodash/last';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO, AggregatedMaterialVO } from 'interface/Material';
import type { FileDTO, FileVO } from 'interface/File';
import { TagTypes } from 'interface/Tag';
import TagTree from 'model/TagTree';
import type { MaterialsFormModel } from 'model/form/MaterialForm';

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly files = shallowRef<FileVO[]>([]);
  readonly tagTree = new TagTree(TagTypes.Material);
  readonly materials = shallowRef<AggregatedMaterialVO[]>([]);

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
    this.queryMaterials();
  };

  readonly queryMaterials = async () => {
    const { body } = await this.#remote.get<void, AggregatedMaterialVO[]>('/materials');
    this.materials.value = body;
  };
}
