import { ref } from '@vue/reactivity';
import { container, singleton } from 'tsyringe';

import type { RawMaterial } from 'model/Material';
import { KnowledgeTypes } from 'model/content/constants';
import MaterialList from 'model/gui/ItemList/MaterialList';
import MaterialRepository from './repository/MaterialRepository';

@singleton()
export default class ItemListService {
  readonly #materialRepository = container.resolve(MaterialRepository);
  readonly currentListType = ref<KnowledgeTypes>(KnowledgeTypes.Notes);
  materialList = new MaterialList();

  readonly setCurrentListType = (type: KnowledgeTypes) => {
    this.currentListType.value = type;

    switch (type) {
      case KnowledgeTypes.Materials:
        return this.#initMaterialList();
      default:
        break;
    }
  };

  readonly #initMaterialList = async () => {
    this.materialList.load([]);
  };

  readonly addMaterials = (files: RawMaterial[]) => {
    this.#materialRepository.add(files);
  };
}
