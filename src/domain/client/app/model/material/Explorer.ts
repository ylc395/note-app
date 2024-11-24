import { container } from '#domain/shared/infra/singletons';
import type { MaterialVO } from '#domain/shared/model/material';
import MaterialTree from '#domain/client/shared/model/material/Tree';
import Explorer, { createUIState, type Events } from '#domain/client/app/model/abstract/Explorer';
import { eventBus, EventNames } from './eventBus';
import StarManager, { EventNames as StarEvents } from '../StarManager';
import EventBus from '../../infra/EventBus';

export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree({ sort: this.sorter.sort });
  private readonly starManager = container.resolve(StarManager);
  public readonly uiState = createUIState('Material-Explorer');

  public readonly events = new EventBus<Events>('note-explorer');

  constructor() {
    super();
    this.starManager.events.on(StarEvents.Toggle, this.tree.update);
    eventBus.on(EventNames.Updated, this.handleEntityUpdated.bind(this));
  }

  protected readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.material.updateOne.mutate([id, { title: name }]);
    eventBus.emit(EventNames.Updated, { trigger: this, payload: { title: name }, id });
  };
}
