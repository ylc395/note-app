import { container, singleton } from 'tsyringe';
import { ref, toRaw } from '@vue/reactivity';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO } from 'dto/Material';
import type { FileDTO, FileVO } from 'dto/File';

export enum AddingTypes {
  None,
  Files,
  Directory,
  Clipboard,
}

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly addingType = ref(AddingTypes.None);
  readonly newMaterials = ref<MaterialDTO[]>([]);

  readonly initNewMaterialsByFiles = async (files: FileDTO[]) => {
    this.addingType.value = AddingTypes.Files;
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
    this.addingType.value = AddingTypes.None;
    this.newMaterials.value = [];
  };
}
