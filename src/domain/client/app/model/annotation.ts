import type { AnnotationVO } from '#domain/shared/model/annotation';
import assert from 'assert';

export * from '#domain/shared/model/annotation';

export function getPage(annotation: AnnotationVO, type: 'start' | 'end' = 'start') {
  const { selector } = annotation;

  if (selector.type === 'PDFSvgSelector') {
    return selector.page;
  }

  if (selector.type === 'PDFTextPositionSelector') {
    return type === 'start' ? selector.position.startPage : selector.position.endPage;
  }

  assert.fail('invalid annotation');
}
