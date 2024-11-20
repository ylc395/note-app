import EventBus from '#domain/client/app/infra/EventBus';
import type { AnnotationPatchDTO, AnnotationVO } from '#domain/shared/model/annotation';

export enum EventNames {
  Created = 'created',
  Updated = 'updated',
  Removed = 'removed',
}

export interface UpdateEvent {
  id: AnnotationVO['id'];
  payload: AnnotationPatchDTO;
  trigger: unknown;
}

type Events = {
  [EventNames.Updated]: UpdateEvent;
  [EventNames.Removed]: AnnotationVO;
  [EventNames.Created]: AnnotationVO;
};

export const eventBus = new EventBus<Events>('domain:annotation');
