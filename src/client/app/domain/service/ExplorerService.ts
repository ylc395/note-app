import { singleton } from 'tsyringe';
import Value from 'model/Value';

export enum ExplorerTypes {
  Materials = 'materials',
  Notes = 'notes',
  Memo = 'memo',
}

@singleton()
export default class ExplorerService {
  readonly currentExplorer = new Value(ExplorerTypes.Materials);
}
