import { singleton, container } from 'tsyringe';

import MemoList from '@domain/app/model/memo/List';
import Calendar from '@domain/app/model/memo/Calendar';

@singleton()
export default class MemoService {
  public readonly list = container.resolve(MemoList);
  public readonly calendar = new Calendar({ onSelect: this.list.setDuration });
}
