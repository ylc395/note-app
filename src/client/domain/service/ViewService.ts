import { ref } from '@vue/reactivity';
import { singleton } from 'tsyringe';

import { KnowledgeTypes } from 'model/content/constants';

@singleton()
export default class ViewService {
  readonly currentView = ref<KnowledgeTypes>(KnowledgeTypes.Notes);
  readonly setCurrentView = (type: KnowledgeTypes) => {
    this.currentView.value = type;
  };
}
