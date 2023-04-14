import { observable, makeObservable, action } from 'mobx';
import { singleton } from 'tsyringe';

export enum ExplorerTypes {
  Materials = 'materials',
  Notes = 'notes',
  Memo = 'memo',
  Dustbin = 'dustbin',
}

export enum NoteExplorerViews {
  Tree = 'tree',
  Custom = 'custom',
}

export enum MaterialExplorerViews {
  Directory = 'directory',
  Custom = 'custom',
}

@singleton()
export default class Layout {
  @observable currentExplorer = ExplorerTypes.Notes;
  @observable readonly explorerPanel = {
    [ExplorerTypes.Notes]: NoteExplorerViews.Tree,
    [ExplorerTypes.Materials]: MaterialExplorerViews.Directory,
  };

  constructor() {
    makeObservable(this);
  }

  @action.bound
  setExplorer(type: ExplorerTypes) {
    this.currentExplorer = type;
  }
}
