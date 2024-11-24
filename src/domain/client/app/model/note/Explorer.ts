import NoteTree from '#domain/client/shared/model/note/Tree';
import type { NoteVO } from '#domain/shared/model/note';
import Explorer, { createUIState, type Events } from '#domain/client/app/model/abstract/Explorer';
import { eventBus, EventNames as NoteEvents } from './eventBus';
import StarManager, { EventNames as StarEvents } from '../StarManager';
import { container } from '#domain/shared/infra/singletons';
import EventBus from '../../infra/EventBus';

export default class NoteExplorer extends Explorer<NoteVO> {
  constructor() {
    super();
    this.starManager.events.on(StarEvents.Toggle, this.tree.update);
    eventBus.on(NoteEvents.Updated, this.handleEntityUpdated.bind(this));
  }

  public readonly events = new EventBus<Events>('note-explorer');

  private readonly starManager = container.resolve(StarManager);

  public readonly tree = new NoteTree({ sort: this.sorter.sort });

  public readonly uiState = createUIState('Note-Explorer');

  protected async submitRename({ id, name }: { id: string; name: string }) {
    await this.remote.note.updateOne.mutate([id, { title: name }]);
    eventBus.emit(NoteEvents.Updated, { trigger: this, payload: { title: name }, id });
  }
}
