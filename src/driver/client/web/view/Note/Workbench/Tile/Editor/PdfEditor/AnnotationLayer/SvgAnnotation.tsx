import assert from 'assert';
import { createMemo } from 'solid-js';

import type { AnnotationVO } from '#domain/shared/model/annotation';

export default function SvgAnnotation(props: { annotation: AnnotationVO }) {
  const svg = createMemo(() => {
    assert(props.annotation.selector.type === 'PDFSvgSelector');
    return props.annotation.selector.svg;
  });

  return <div innerHTML={svg()}></div>;
}
