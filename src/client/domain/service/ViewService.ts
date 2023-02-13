import { observable, makeObservable, action } from 'mobx';
import { singleton } from 'tsyringe';

export enum ViewTypes {
  Materials = 'materials',
  Notes = 'notes',
  // Memos = 'memos',
  // Projects = 'projects',
  // Cards = 'cards',
}

export function isViewTypes(key: string): key is ViewTypes {
  return (Object.values(ViewTypes) as string[]).includes(key);
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

  constructor() {
    makeObservable(this);
  }

  @action.bound
  setCurrentView(type: ViewTypes) {
    this.currentView = type;
  }
}
