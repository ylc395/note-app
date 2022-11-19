import { container, singleton } from 'tsyringe';
import { observable, makeObservable, action, runInAction } from 'mobx';

import { type Remote, token as remoteToken } from 'infra/Remote';
import type { MaterialDTO, MaterialVO } from 'interface/Material';
import type { FileDTO, FileVO } from 'interface/File';
import type { TagVO } from 'interface/Tag';
import TagTree, { Events as TagTreeEvents } from 'model/TagTree';
import MaterialsForm, { type MaterialsFormModel } from 'model/form/MaterialForm';

@singleton()
export default class MaterialService {
  readonly #remote: Remote = container.resolve(remoteToken);
  readonly tagTree = new TagTree();
  @observable materials: MaterialVO[] = [];
  #files: FileVO[] = [];
  @observable.ref editingMaterials?: MaterialsForm;

  constructor() {
    this.tagTree.on(TagTreeEvents.Deleted, this.handleTagRemoved);
    makeObservable(this);
  }

  @action
  private readonly handleTagRemoved = (deletedIds: TagVO['id'][]) => {
    for (const material of this.materials) {
      material.tags = material.tags.filter(({ id }) => !deletedIds.includes(id));
    }
  };

  readonly uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const { body: createdFiles } = await this.#remote.post<FileDTO[], Required<FileVO>[]>(
      '/files',
      files.map(({ type: mimeType, path }) => ({ isTemp: true, mimeType, sourceUrl: `file://${path}` })),
    );

    runInAction(() => {
      this.#files = createdFiles;

      const form = new MaterialsForm(this.#files);
      form.handleSubmit(this.#uploadMaterials);
      this.editingMaterials = form;
    });
  };

  @action.bound
  clearFiles() {
    if (!this.editingMaterials) {
      throw new Error('no editingMaterials');
    }

    this.#files = [];
    this.editingMaterials.destroy();
    this.editingMaterials = undefined;
  }

  readonly #uploadMaterials = async (materials: MaterialsFormModel) => {
    await this.#remote.post<MaterialDTO[], unknown>('/materials', materials);
    this.clearFiles();
    this.queryMaterials();
  };

  readonly queryMaterials = async () => {
    const { body } = await this.#remote.get<void, MaterialVO[]>('/materials');
    runInAction(() => {
      this.materials = body;
    });
  };
}
