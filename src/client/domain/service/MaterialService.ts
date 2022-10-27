import { container, singleton } from 'tsyringe';
import { ref, toRaw } from '@vue/reactivity';

import { token as remoteToken } from 'infra/Remote';
import type { Material } from 'model/Material';
import type { File } from 'model/File';

export enum AddingTypes {
  None,
  Files,
  Directory,
  Clipboard,
}

type FileDto = Pick<File, 'sourceUrl' | 'mimeType'>;
type MaterialDto = Pick<Material, 'comment' | 'name' | 'rating'> & { file: { id: File['id'] } };

@singleton()
export default class MaterialService {
  readonly #remote = container.resolve(remoteToken);
  readonly addingType = ref(AddingTypes.None);
  readonly materials = ref<MaterialDto[]>([]);

  readonly addMaterialsByFiles = async (files: FileDto[]) => {
    this.addingType.value = AddingTypes.Files;
    const { body: createdFiles } = await this.#remote.post<FileDto[], File[]>('/files', files);

    this.materials.value = createdFiles.map(({ id }) => ({
      file: { id },
      comment: '',
      rating: 0,
      name: '',
    }));
  };

  readonly uploadMaterials = async () => {
    await this.#remote.post<MaterialDto[], Material[]>('/materials', toRaw(this.materials.value));
    this.addingType.value = AddingTypes.None;
    this.materials.value = [];
  };
}
