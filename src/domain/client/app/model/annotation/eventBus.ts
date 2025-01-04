import EventBus from '#domain/client/app/infra/EventBus';
import type { AnnotationPatchDTO, AnnotationVO } from '#domain/shared/model/annotation';

interface UpdateEvent {
  id: AnnotationVO['id'];
  payload: AnnotationPatchDTO;
}

export const eventBus = new EventBus<{
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: AnnotationVO;
  [EventNames.Created]: AnnotationVO;
}>('domain:annotation');

export enum EventNames {
  Created = 'created',
  Updated = 'updated',
  Removed = 'removed',
}
