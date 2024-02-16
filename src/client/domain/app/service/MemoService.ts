import { singleton, container } from 'tsyringe';

import MemoEditor from '@domain/app/model/memo/Editor';
import MemoList from '@domain/app/model/memo/List';

@singleton()
export default class MemoService {
  public readonly list = container.resolve(MemoList);
  public readonly newMemoEditor = new MemoEditor({ onSubmit: this.list.add });
}
