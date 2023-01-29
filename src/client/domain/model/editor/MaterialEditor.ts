import { computed, makeObservable, observable, runInAction } from 'mobx';

import type { MaterialVO } from 'interface/Material';
import BaseEditor from './BaseEditor';

export default class MaterialEditor extends BaseEditor {
  @observable.ref blob?: ArrayBuffer;
  @observable.ref material?: MaterialVO;

  @computed get title() {
    return this.material?.name || '';
  }

  constructor(readonly entityId: MaterialVO['id']) {
    super();
    makeObservable(this);
    this.load();
  }

  private async load() {
    const { body: material } = await this.remote.get<void, MaterialVO>(`/materials/${this.entityId}`);

    runInAction(() => {
      this.material = material;
    });

    if (material.file) {
      const { body: blob } = await this.remote.get<void, ArrayBuffer>(`/files/${material.file.id}/blob`);
      // const { body: annotations } = await this.#remote.get<void, ArrayBuffer>(`/materials/${id}/annotations`);

      runInAction(() => {
        this.blob = blob;
      });
    }
  }
}
