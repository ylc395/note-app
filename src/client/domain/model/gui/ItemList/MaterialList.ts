import { ref, Ref, shallowRef } from '@vue/reactivity';
import type { Material } from 'model/content/Material';

export enum ViewTypes {
  Tag = 'tagView',
  Type = 'typeView',
  Source = 'sourceView',
}

export default class MaterialList {
  readonly viewType: Ref<ViewTypes> = ref(ViewTypes.Tag);
  readonly materials: Ref<Material[] | undefined> = shallowRef();

  readonly changeView = (type: ViewTypes) => {
    this.viewType.value = type;
  };

  readonly load = (materials: Material[]) => {
    this.materials.value = materials;
  };
}
