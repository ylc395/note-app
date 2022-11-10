import { container, singleton } from 'tsyringe';
import { shallowRef, ref } from '@vue/reactivity';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO } from 'interface/Material';
import type { FileDTO, CreatedFileVO } from 'interface/File';
import type { TagVO } from 'interface/Tag';
import TagTree, { Events as TagTreeEvents } from 'model/TagTree';
import MaterialsForm, { type MaterialsFormModel } from 'model/form/MaterialForm';

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly files = shallowRef<CreatedFileVO[]>([]);
  readonly tagTree = new TagTree();
  readonly materials = ref<MaterialVO[]>([]);
  readonly editingMaterials = shallowRef<MaterialsForm>();

  constructor() {
    this.tagTree.on(TagTreeEvents.Deleted, this.#handleTagRemoved);
  }

  readonly #handleTagRemoved = (deletedIds: TagVO['id'][]) => {
    for (const material of this.materials.value) {
      material.tags = material.tags.filter(({ id }) => !deletedIds.includes(id));
    }
  };

  readonly uploadFiles = async (files: FileDTO[]) => {
    const { body: createdFiles } = await this.#remote.post<FileDTO[], CreatedFileVO[]>('/files', files);

    this.files.value = createdFiles;

    const form = new MaterialsForm(this.files.value);
    form.handleSubmit(this.#uploadMaterials);
    this.editingMaterials.value = form;
  };

  readonly clearFiles = () => {
    if (!this.editingMaterials.value) {
      throw new Error('no editingMaterials');
    }

    this.files.value = [];
    this.editingMaterials.value.destroy();
    this.editingMaterials.value = undefined;
  };

  readonly #uploadMaterials = async (materials: MaterialsFormModel) => {
    await this.#remote.post<MaterialDTO[], unknown>(
      '/materials',
      materials.map((v, i) => ({
        ...v,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fileId: this.files.value[i]!.id,
      })),
    );
    this.files.value = [];
    this.queryMaterials();
  };

  readonly queryMaterials = async () => {
    const { body } = await this.#remote.get<void, MaterialVO[]>('/materials');
    this.materials.value = body;
  };
}
