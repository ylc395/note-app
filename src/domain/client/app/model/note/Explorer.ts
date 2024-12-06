import NoteTree from '#domain/client/shared/model/note/Tree';
import type { NoteVO } from '#domain/shared/model/note';
import Explorer, { createUIState, type Events } from '#domain/client/app/model/abstract/Explorer';
import { container } from '#domain/shared/infra/singletons';
import { EntityTypes } from '#domain/client/shared/model/entity';

import EventBus from '../../infra/EventBus';
import DomainEventBus from './EventBus';
import StarManager, { EventNames as StarEvents } from '../StarManager';
import NoteEventBus from './EventBus';
import RenameBehavior from '../abstract/Explorer/RenameBehavior';

export default class NoteExplorer extends Explorer<NoteVO> {
  constructor() {
    super();
    this.starManager.events.on(StarEvents.Toggle, this.tree.update);
    this.domainEventBus.on(DomainEventBus.eventNames.Updated, this.handleEntityUpdated.bind(this));
    this.rename = new RenameBehavior({ onSubmit: this.submitRename.bind(this) });
  }

  public readonly rename: RenameBehavior;

  public readonly entityType = EntityTypes.Note;

  public readonly events = new EventBus<Events>('note-explorer');

  private readonly domainEventBus = container.resolve(NoteEventBus);

  private readonly starManager = container.resolve(StarManager);

  public readonly tree = this.createTree();

  public readonly uiState = createUIState('Note-Explorer');

  private async submitRename({ id, name }: { id: string; name: string }) {
    await this.remote.note.updateOne.mutate([id, { title: name }]);
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, { trigger: this, payload: { title: name }, id });
  }

  public createTree() {
    return new NoteTree({
      sort: this.sorter.sort,
      isDisabled: this.isNodeDisabled.bind(this),
    });
  }

  public getContextMenuItems() {}
}
