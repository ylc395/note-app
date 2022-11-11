import { observable, makeObservable, action } from 'mobx';
import { singleton } from 'tsyringe';

import { KnowledgeTypes } from 'model/content/constants';

@singleton()
export default class ViewService {
  constructor() {
    makeObservable(this);
  }
  @observable currentView = KnowledgeTypes.Materials;

  @action.bound
  setCurrentView(type: KnowledgeTypes) {
    this.currentView = type;
  }
}
