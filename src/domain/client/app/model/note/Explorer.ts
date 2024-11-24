import NoteTree from '#domain/client/shared/model/note/Tree';
import type { NoteVO } from '#domain/shared/model/note';
import Explorer, { uiStateSchema } from '#domain/client/app/model/abstract/Explorer';
import { eventBus, EventNames as NoteEvents } from './eventBus';
import StarManager, { EventNames as StarEvents } from '../StarManager';
import { container } from '#domain/shared/infra/singletons';
import UIState from '../abstract/UIState';

export default class NoteExplorer extends Explorer<NoteVO> {
  constructor() {
    super();
    this.starManager.on(StarEvents.Toggle, this.tree.update);
    eventBus.on(NoteEvents.Updated, this.handleEntityUpdated.bind(this));
  }

  private readonly starManager = container.resolve(StarManager);

  public readonly tree = new NoteTree({ sort: this.sorter.sort });

  public readonly uiState = new UIState('Note-Explorer', uiStateSchema);

  protected async submitRename({ id, name }: { id: string; name: string }) {
    await this.remote.note.updateOne.mutate([id, { title: name }]);
    eventBus.emit(NoteEvents.Updated, { trigger: this, payload: { title: name }, id });
  }
}
