import { observable, makeObservable, action } from 'mobx';
import { singleton } from 'tsyringe';

import { KnowledgeTypes } from 'model/constants';

@singleton()
export default class ViewService {
  constructor() {
    makeObservable(this);
  }
  @observable currentView = KnowledgeTypes.Notes;

  @action.bound
  setCurrentView(type: KnowledgeTypes) {
    this.currentView = type;
  }
}
