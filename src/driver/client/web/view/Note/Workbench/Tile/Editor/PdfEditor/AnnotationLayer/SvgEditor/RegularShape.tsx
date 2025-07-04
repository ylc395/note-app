import { SVG, type Element, type Polygon } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draw.js';
import { createEventListener } from '@solid-primitives/event-listener';
import assert from 'assert';
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import { Shape } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';

const methodMap = {
  [Shape.Circle]: 'circle',
  [Shape.Rect]: 'rect',
  [Shape.Polygon]: 'polygon',
} as const;

export default function RegularShape(props: {
  svgElement: SVGAElement;
  shape: Shape;
  thickness: number;
  color: string;
  fillColor: string;
  pageElement: HTMLElement;
  onCreate: (e: string) => void;
}) {
  const draw = SVG(props.svgElement);
  const method = createMemo(() => {
    assert(props.shape !== Shape.Free);
    return methodMap[props.shape];
  });

  let shape: Element | undefined;
  const [resetFlag, forceReset] = createSignal(0);

  function done(e?: Event) {
    if (shape) {
      if (props.shape === Shape.Polygon && (shape as Polygon).array().length === 1) {
        return;
      }

      if (e) {
        shape.draw(e);
      } else {
        shape.draw('done');
      }

      shape.remove();
      props.onCreate(shape.svg());
    }

    forceReset(resetFlag() + 1);
  }

  createEffect(() => {
    resetFlag();
    shape = draw[method()]().draw().stroke({ width: props.thickness }).fill(props.fillColor).stroke(props.color);

    onCleanup(() => {
      shape?.draw('cancel');
    });
  });

  createEventListener(props.pageElement, 'pointerdown', (e) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    shape?.draw(e);
  });

  createEventListener(props.pageElement, 'pointerup', (e) => {
    if (props.shape !== Shape.Polygon) {
      done(e);
    }
  });

  createEventListener(document, 'keypress', (e) => {
    if (props.shape === Shape.Polygon && e.code === 'Enter') {
      done();
    }
  });

  return null;
}
