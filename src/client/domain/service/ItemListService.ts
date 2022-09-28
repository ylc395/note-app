import { ref, Ref, shallowRef } from '@vue/reactivity';
import { singleton } from 'tsyringe';

import { KnowledgeTypes } from 'model/content/constants';
import MaterialList, { ViewTypes } from 'model/gui/ItemList/MaterialList';

@singleton()
export default class ItemListService {
  readonly currentListType = ref<KnowledgeTypes>(KnowledgeTypes.Notes);
  materialList?: MaterialList;
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
    if (this.materialList) {
      return;
    }

    this.materialList = new MaterialList(ViewTypes.Tag);
  };
}
