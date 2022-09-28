import { ref } from '@vue/reactivity';
import { singleton } from 'tsyringe';

import { KnowledgeTypes } from 'model/content/constants';
import MaterialList from 'model/gui/ItemList/MaterialList';

@singleton()
export default class ItemListService {
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

  readonly addMaterial = () => {
    console.log(111);
  };
}
