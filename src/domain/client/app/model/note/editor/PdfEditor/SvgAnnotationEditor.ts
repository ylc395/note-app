import { action, computed, observable } from 'mobx';
import { z } from 'zod';
import { SVG } from '@svgdotjs/svg.js'; // 这个库理论上和环境无关，故放在 model 层了

import type { AnnotationVO } from '#domain/shared/model/annotation';
import type AnnotationManager from './AnnotationManager';
import { assign, expose, instanceToPlain } from '#utils/classTransformer';

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

  @observable
  @expose()
  public accessor shape = Shape.Rect;

  @observable
  @expose()
  public accessor color = 'red';

  @observable
  @expose()
  public accessor fillColor = 'transparent';

  @observable
  @expose()
  public accessor thickness = 5;

  @action
  public init(v?: z.infer<typeof SvgAnnotationEditor.schema>) {
    if (v) {
      assign<SvgAnnotationEditor>(this, v);
    }
  }

  @computed
  public get options() {
    return instanceToPlain(this);
  }

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

  public static readonly schema = z.object({
    color: z.string().optional().catch(undefined).catch('red'),
    fillColor: z.string().optional().catch(undefined).catch('transparent'),
    thickness: z.number().optional().catch(undefined).catch(5),
    shape: z.enum(Shape).optional().catch(undefined).catch(Shape.Rect),
  });
}
