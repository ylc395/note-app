import { computed, makeObservable, observable, runInAction } from 'mobx';

import type { MaterialVO } from 'interface/Material';
import EntityEditor from './EntityEditor';
import type Window from 'model/Window';

export default class MaterialEditor extends EntityEditor {
  @observable.ref blob?: ArrayBuffer;
  @observable.ref material?: MaterialVO;

  @computed get title() {
    return this.material?.name || '';
  }

  constructor(protected readonly window: Window, readonly entityId: MaterialVO['id']) {
    super(window, entityId);
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
