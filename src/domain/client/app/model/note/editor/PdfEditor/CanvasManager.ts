import { action, observable } from 'mobx';
import { z } from 'zod';

import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import type AnnotationManager from './AnnotationManager';

export enum Shape {
  Rect = 'rect',
  Circle = 'circle',
  Polygon = 'polygon',
  Free = 'free',
}

export enum Mode {
  Draw = 'draw',
  Erase = 'erase',
}

export default class CanvasManager {
  constructor(private readonly annotationManager: AnnotationManager) {}
  @observable public accessor isEnabled = false;
  @observable public accessor mode = Mode.Draw;
  public readonly options = new PersistedMap(
    'pdf-canvas-options',
    z.object({
      color: z.string(),
      fillColor: z.string(),
      thickness: z.number(),
      shape: z.nativeEnum(Shape),
    }),
    {
      color: 'red',
      fillColor: 'transparent',
      thickness: 5,
      shape: Shape.Rect,
    },
  );

  @action
  public toggle() {
    this.isEnabled = !this.isEnabled;
  }

  @action
  public toggleMode() {
    this.mode = this.mode === Mode.Draw ? Mode.Erase : Mode.Draw;
  }

  public getAnnotations(page: number) {
    return this.annotationManager.items.result.data?.filter(
      (annotation) => annotation.selector.type === 'PDFSvgSelector' && annotation.selector.page === page,
    );
  }
}
