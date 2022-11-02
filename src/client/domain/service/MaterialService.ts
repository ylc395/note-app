import { container, singleton } from 'tsyringe';
import { ref, toRaw } from '@vue/reactivity';
import { watch } from '@vue-reactivity/watch';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO } from 'interface/Material';
import type { FileDTO, FileVO } from 'interface/File';
import { TagTypes } from 'interface/Tag';
import TagTree from 'model/TagTree';

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly newMaterials = ref<MaterialDTO[]>([]);
  readonly tagTree = new TagTree(TagTypes.Material);

  constructor() {
    watch(this.tagTree.selectedTag, this.#queryMaterials);
  }

  readonly generateNewMaterialsByFiles = async (files: FileDTO[]) => {
    const { body: createdFiles } = await this.#remote.post<FileDTO[], FileVO[]>('/files', files);

    this.newMaterials.value = createdFiles.map(({ id }) => ({
      fileId: id,
      comment: '',
      rating: 0,
      name: '',
    }));
  };

  readonly uploadMaterials = async () => {
    await this.#remote.post<MaterialDTO[], MaterialVO[]>('/materials', toRaw(this.newMaterials.value));
    this.newMaterials.value = [];
  };

  readonly #queryMaterials = () => {
    if (!this.tagTree.selectedTag.value) {
      return;
    }
  };
}
