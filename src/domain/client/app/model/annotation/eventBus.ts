import EventBus from '#domain/client/app/infra/EventBus';
import type { AnnotationPatchDTO, AnnotationVO } from '#domain/shared/model/annotation';

enum EventNames {
  Created = 'created',
  Updated = 'updated',
  Removed = 'removed',
}

interface UpdateEvent {
  id: AnnotationVO['id'];
  payload: AnnotationPatchDTO;
  trigger: unknown;
}

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: AnnotationVO;
  [EventNames.Created]: AnnotationVO;
};

export default class AnnotationEventBus extends EventBus<Events> {
  constructor() {
    super('domain:annotation');
  }

  public static readonly eventNames = EventNames;
}
