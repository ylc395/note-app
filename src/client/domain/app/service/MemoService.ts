import { singleton, container } from 'tsyringe';

import MemoExplorer from '@domain/app/model/memo/Explorer';
import Calendar from '@domain/app/model/memo/Calendar';

@singleton()
export default class MemoService {
  public readonly explorer = container.resolve(MemoExplorer);
  public readonly calendar = new Calendar({ onSelect: this.explorer.setDuration });
}
