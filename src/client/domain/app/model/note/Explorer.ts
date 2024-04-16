import { singleton } from 'tsyringe';

import NoteTree from '@domain/common/model/note/Tree';
import type { NoteVO } from '@shared/domain/model/note';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import { eventBus, Events as NoteEvents } from './eventBus';

@singleton()
export default class NoteExplorer extends Explorer<NoteVO> {
  constructor() {
    super();
    eventBus.on(NoteEvents.Updated, this.handleEntityUpdate);
  }
  public readonly tree = new NoteTree({ sort: this.sorter.sort });

  protected queryPath(id: NoteVO['id']) {
    return this.remote.note.queryPath.query(id);
  }

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.note.updateOne.mutate([id, { title: name }]);
    eventBus.emit(NoteEvents.Updated, { id, trigger: this.rename, title: name });
  };

  public readonly rename = new RenameBehavior({ onSubmit: this.submitRename });
}
