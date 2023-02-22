import { observable, makeObservable, action } from 'mobx';
import { singleton } from 'tsyringe';

export enum ExplorerTypes {
  Materials = 'materials',
  Notes = 'notes',
  Timeline = 'timeline',
  Topic = 'topic',
  Code = 'code',
  Dustbin = 'dustbin',
  Graph = 'graph',
  Todo = 'todo',
}

export enum NoteExplorerPanel {
  Tree = 'tree',
  CustomView = 'customView',
}

@singleton()
export default class Layout {
  @observable currentExplorer = ExplorerTypes.Notes;
  @observable readonly explorerPanel = {
    [ExplorerTypes.Notes]: NoteExplorerPanel.Tree,
  };

  constructor() {
    makeObservable(this);
  }

  @action.bound
  setExplorer(type: ExplorerTypes) {
    this.currentExplorer = type;
  }
}
