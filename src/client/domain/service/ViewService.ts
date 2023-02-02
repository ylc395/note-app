import { observable, makeObservable, action } from 'mobx';
import { container, singleton } from 'tsyringe';

import { token as contextmenuToken } from 'infra/Contextmenu';

export enum ViewTypes {
  Materials = 'materials',
  Notes = 'notes',
  // Memos = 'memos',
  // Projects = 'projects',
  // Cards = 'cards',
}

export enum NoteExplorerPanel {
  Tree = 'tree',
  Ranking = 'ranking',
  Topic = 'topic',
}

@singleton()
export default class ViewService {
  @observable currentView = ViewTypes.Notes;
  @observable readonly explorerPanel = {
    [ViewTypes.Notes]: NoteExplorerPanel.Tree,
  };

  readonly contextmenu = container.resolve(contextmenuToken);

  constructor() {
    makeObservable(this);
  }

  @action.bound
  setCurrentView(type: ViewTypes) {
    this.currentView = type;
  }
}
