import { container, singleton } from 'tsyringe';
import { observable, makeObservable, action, flow } from 'mobx';

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
  #files: CreatedFileVO[] = [];
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

  @flow.bound
  *uploadFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const { body: createdFiles } = yield this.#remote.post<FileDTO[], CreatedFileVO[]>(
      '/files',
      files.map(({ type: mimeType, path }) => ({ isTemp: true, mimeType, sourceUrl: `file://${path}` })),
    );

    this.#files = createdFiles;

    const form = new MaterialsForm(this.#files);
    form.handleSubmit(this.#uploadMaterials);
    this.editingMaterials = form;
  }

  @action.bound
  clearFiles() {
    if (!this.editingMaterials) {
      throw new Error('no editingMaterials');
    }

    this.#files = [];
    this.editingMaterials.destroy();
    this.editingMaterials = undefined;
  }

  #uploadMaterials = async (materials: MaterialsFormModel) => {
    await this.#remote.post<MaterialDTO[], unknown>('/materials', materials);
    this.clearFiles();
    this.queryMaterials();
  };

  @flow
  private *queryMaterials() {
    const { body } = yield this.#remote.get<void, MaterialVO[]>('/materials');
    this.materials = body;
  }
}
