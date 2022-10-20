import { container, singleton } from 'tsyringe';

import type { Material } from 'model/Material';
import { token as remoteToken } from 'infra/Remote';

@singleton()
export default class MaterialService {
  readonly #remote = container.resolve(remoteToken);

  readonly addMaterials = async (materials: Partial<Material>[]) => {
    const results = await this.#remote.post('/materials', materials);
    console.log(results);
  };
}
