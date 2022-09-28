import { ref, Ref } from '@vue/reactivity';

export enum ViewTypes {
  Tag = 'tagView',
  Type = 'typeView',
  Source = 'sourceView',
}

export default class MaterialList {
  readonly viewType: Ref<ViewTypes>;

  constructor(viewType: ViewTypes) {
    this.viewType = ref(viewType);
  }

  readonly changeView = (type: ViewTypes) => {
    this.viewType.value = type;
  };
}
