import { container, singleton } from 'tsyringe';
import { observable, makeObservable, action } from 'mobx';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO } from 'interface/Material';
import type { FileDTO, CreatedFileVO } from 'interface/File';
import type { TagVO } from 'interface/Tag';
import TagTree, { Events as TagTreeEvents } from 'model/TagTree';
import MaterialsForm, { type MaterialsFormModel } from 'model/form/MaterialForm';

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly tagTree = new TagTree();
  @observable materials: MaterialVO[] = [];
  @observable.ref files: CreatedFileVO[] = [];
  @observable.ref editingMaterials?: MaterialsForm;

  constructor() {
    this.tagTree.on(TagTreeEvents.Deleted, this.handleTagRemoved);
    makeObservable(this);
  }

  @action.bound
  private handleTagRemoved(deletedIds: TagVO['id'][]) {
    for (const material of this.materials) {
      material.tags = material.tags.filter(({ id }) => !deletedIds.includes(id));
    }
  }

  @action.bound
  async uploadFiles(files: FileDTO[]) {
    const { body: createdFiles } = await this.#remote.post<FileDTO[], CreatedFileVO[]>('/files', files);

    this.files = createdFiles;

    const form = new MaterialsForm(this.files);
    form.handleSubmit(this.uploadMaterials);
    this.editingMaterials = form;
  }

  @action.bound
  clearFiles() {
    if (!this.editingMaterials) {
      throw new Error('no editingMaterials');
    }

    this.files = [];
    this.editingMaterials.destroy();
    this.editingMaterials = undefined;
  }

  @action.bound
  private async uploadMaterials(materials: MaterialsFormModel) {
    await this.#remote.post<MaterialDTO[], unknown>(
      '/materials',
      materials.map((v, i) => ({
        ...v,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fileId: this.files[i]!.id,
      })),
    );
    this.files = [];
    this.queryMaterials();
  }

  @action.bound
  private async queryMaterials() {
    const { body } = await this.#remote.get<void, MaterialVO[]>('/materials');
    this.materials = body;
  }
}
