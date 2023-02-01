import { observable, makeObservable, action } from 'mobx';
import { singleton } from 'tsyringe';

export enum ViewTypes {
  Materials = 'materials',
  Notes = 'notes',
  // Memos = 'memos',
  // Projects = 'projects',
  // Cards = 'cards',
}

export enum NoteExplorerPanel {
  Tree = 'tree',
  Star = 'star',
}

@singleton()
export default class ViewService {
  @observable currentView = ViewTypes.Notes;
  @observable readonly explorerVisible = {
    [ViewTypes.Notes]: true,
    [ViewTypes.Materials]: true,
  };

  @observable readonly explorerPanel = {
    [ViewTypes.Notes]: NoteExplorerPanel.Tree,
  };

  constructor() {
    makeObservable(this);
  }

  @action.bound
  setCurrentView(type: ViewTypes) {
    this.currentView = type;
  }

  @action.bound
  toggleExplorerVisibility(type: ViewTypes) {
    this.explorerVisible[type] = !this.explorerVisible[type];
  }
}
