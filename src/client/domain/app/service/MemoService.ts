import { singleton, container } from 'tsyringe';

import MemoEditor from '@domain/app/model/memo/Editor';
import MemoList from '@domain/app/model/memo/List';
import Calendar from '@domain/app/model/memo/Calendar';

@singleton()
export default class MemoService {
  public readonly list = container.resolve(MemoList);
  public readonly newMemoEditor = new MemoEditor({ onSubmit: this.list.add });
  public readonly calendar = new Calendar({ onSelect: this.list.setDuration });
}
