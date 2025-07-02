import assert from 'assert';
import { createMemo } from 'solid-js';
import { SVG } from '@svgdotjs/svg.js';

import type { AnnotationVO } from '#domain/shared/model/annotation';

export default function SvgAnnotation(props: { annotation: AnnotationVO }) {
  const svg = createMemo(() => {
    assert(props.annotation.selector.type === 'PDFSvgSelector');
    return SVG(props.annotation.selector.svg)
      .children()
      .map((el) => el.svg())
      .join('');
  });

  return <g innerHTML={svg()}></g>;
}
