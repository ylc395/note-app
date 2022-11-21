import { makeObservable, observable, runInAction } from 'mobx';
import { container } from 'tsyringe';

import type { MaterialVO } from 'interface/Material';
import { type Remote, token as remoteToken } from 'infra/Remote';

export default class MaterialEditor {
  @observable.ref blob?: ArrayBuffer;

  readonly #remote: Remote = container.resolve(remoteToken);
  readonly #material: MaterialVO;

  get materialId() {
    return this.#material.id;
  }

  get type() {
    if (this.#material.file) {
      return this.#material.file.mimeType;
    }

    if (this.#material.note) {
      return 'note';
    }

    throw new Error('no material or note');
  }

  constructor(material: MaterialVO) {
    this.#material = material;
    makeObservable(this);

    this.#load();
  }

  #load = async () => {
    const { file } = this.#material;

    if (file) {
      const { body: blob } = await this.#remote.get<void, ArrayBuffer>(`/files/${file.id}/blob`);
      // const { body: annotations } = await this.#remote.get<void, ArrayBuffer>(`/materials/${id}/annotations`);

      runInAction(() => {
        this.blob = blob;
      });
    }
  };
}
