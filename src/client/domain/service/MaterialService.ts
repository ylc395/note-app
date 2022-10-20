import { container, singleton } from 'tsyringe';

import type { RawMaterial } from 'model/Material';
import MaterialRepository from './repository/MaterialRepository';

@singleton()
export default class MaterialService {
  readonly #materialRepository = container.resolve(MaterialRepository);

  readonly addMaterials = (files: RawMaterial[]) => {
    this.#materialRepository.add(files);
  };
}
