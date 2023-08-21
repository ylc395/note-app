import { observable, makeObservable } from 'mobx';
import { singleton } from 'tsyringe';
import Value from './Value';

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
  constructor() {
    makeObservable(this);
  }

  currentExplorer = new Value(ExplorerTypes.Materials);

  @observable readonly explorerPanel = {
    [ExplorerTypes.Notes]: NoteExplorerViews.Tree,
    [ExplorerTypes.Materials]: MaterialExplorerViews.Directory,
  };
}
