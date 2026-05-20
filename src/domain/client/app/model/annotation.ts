import type { AnnotationVO } from '#domain/shared/model/annotation';
import assert from 'assert';
import { range } from 'lodash-es';

export * from '#domain/shared/model/annotation';

export function getPageRange(annotation: AnnotationVO) {
  const { selector } = annotation;

  if (selector.type === 'PDFSvgSelector') {
    return [selector.page];
  }

  if (selector.type === 'PDFTextPositionSelector') {
    return range(selector.position.startPage, selector.position.endPage + 1);
  }

  assert.fail('invalid annotation');
}
