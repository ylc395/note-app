import { container, singleton } from 'tsyringe';

import NoteTree from '#domain/client/common/model/note/Tree';
import type { NoteVO } from '#domain/shared/model/note';
import Explorer from '#domain/client/app/model/abstract/Explorer';
import RenameBehavior from '#domain/client/app/model/abstract/Explorer/RenameBehavior';
import { eventBus, Events as NoteEvents } from './eventBus';
import StarManager, { Events as StarEvents } from '../StarManager';

@singleton()
export default class NoteExplorer extends Explorer<NoteVO> {
  public readonly tree = new NoteTree({ sort: this.sorter.sort });
  private readonly starManager = container.resolve(StarManager);
  constructor() {
    super();
    this.starManager.on(StarEvents.Toggle, this.tree.updateTree);
    eventBus.on(NoteEvents.Updated, this.handleEntityUpdate);
  }

  protected queryPath(id: NoteVO['id']) {
    return this.remote.note.queryPath.query(id);
  }

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.note.updateOne.mutate([id, { title: name }]);
    eventBus.emit(NoteEvents.Updated, { trigger: this.rename, entity: { title: name, id } });
  };

  public readonly rename = new RenameBehavior({ onSubmit: this.submitRename });
}
