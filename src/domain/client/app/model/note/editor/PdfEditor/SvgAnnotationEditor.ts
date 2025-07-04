import { action, observable } from 'mobx';
import { z } from 'zod';
import { SVG } from '@svgdotjs/svg.js'; // 这个库理论上和环境无关，故放在 model 层了

import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import type { AnnotationVO } from '#domain/shared/model/annotation';
import type AnnotationManager from './AnnotationManager';

export enum Shape {
  Rect = 'rect',
  Circle = 'circle',
  Polygon = 'polygon',
  Free = 'free',
}

export enum Mode {
  Draw = 'draw',
  Select = 'select',
}

export default class SvgAnnotationEditor {
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
  public toggleMode(mode: Mode) {
    this.mode = this.mode === mode ? Mode.Draw : mode;
  }

  public getAnnotations(page: number) {
    return this.annotationManager.items.result.data?.filter(
      (annotation) => annotation.selector.type === 'PDFSvgSelector' && annotation.selector.page === page,
    );
  }

  @observable public accessor selectedSvg = new Set<AnnotationVO['id']>();

  public static toSvgSelector(viewBox: { width: number; height: number }, page: number, elementText: string) {
    const draw = SVG()
      .viewbox({ ...viewBox, x: 0, y: 0 })
      .svg(elementText);

    return {
      selector: { type: 'PDFSvgSelector', page, svg: draw.svg() },
    } as const;
  }
}
