import { computed, makeObservable, observable, runInAction } from 'mobx';
import { container } from 'tsyringe';
import uid from 'lodash/uniqueId';

import type { MaterialVO } from 'interface/Material';
import { type Remote, token as remoteToken } from 'infra/Remote';

export default class MaterialEditor {
  readonly id = uid('editor-');
  readonly #remote: Remote = container.resolve(remoteToken);
  @observable.ref blob?: ArrayBuffer;
  @observable.ref material?: MaterialVO;

  @computed get type() {
    return this.material?.file?.mimeType.startsWith('image/') ? 'image' : 'unknown';
  }

  constructor(readonly materialId: MaterialVO['id']) {
    makeObservable(this);
    this.load();
  }

  private async load() {
    const { body: material } = await this.#remote.get<void, MaterialVO>(`/materials/${this.materialId}`);

    runInAction(() => {
      this.material = material;
    });

    if (material.file) {
      const { body: blob } = await this.#remote.get<void, ArrayBuffer>(`/files/${material.file.id}/blob`);
      // const { body: annotations } = await this.#remote.get<void, ArrayBuffer>(`/materials/${id}/annotations`);

      runInAction(() => {
        this.blob = blob;
      });
    }
  }
}
