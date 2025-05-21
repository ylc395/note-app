import { createEffect, createSignal, For, onCleanup } from 'solid-js';
import assert from 'assert';
import { processFragmentDirectives, removeMarks } from '#third-party/text-fragments-polyfill/text-fragment-utils';
import { action } from 'mobx';

import type { AnnotationVO, PDFTextFragmentSelector } from '#domain/shared/model/annotation';
import { APP_NAME } from '#domain/shared/infra/constants';

import type PdfViewer from '../PDFViewer';
import AnnotationComment from './AnnotationComment';

export default function PageAnnotationLayer(props: { page: number; pdfViewer: PdfViewer }) {
  const [annotationsWithMark, setAnnotationWithMark] =
    createSignal<Array<{ markEl: HTMLElement; annotation: AnnotationVO }>>();

  createEffect(() => {
    const annotations = props.pdfViewer.editor.annotation.list?.filter(
      ({ selector: s }) => s.type === 'PDFTextFragmentSelector' && s.fragments.some(({ page }) => props.page === page),
    );

    if (!annotations) {
      return;
    }

    const result: Array<{ markEl: HTMLElement; annotation: AnnotationVO }> = [];

    for (const annotation of annotations) {
      const selector = annotation.selector as PDFTextFragmentSelector;
      const fragment = selector.fragments.find(({ page }) => page === props.page);
      const root = props.pdfViewer.getPageTextLayerElement(props.page);

      assert(root && fragment);

      const { text } = processFragmentDirectives({ text: [fragment] }, document, root);

      for (const [i, marks] of text.entries()) {
        for (const [j, el] of marks.entries()) {
          (el as HTMLElement).style.backgroundColor = annotation.color;
          (el as HTMLElement).style.color = 'transparent';
          (el as HTMLElement).style.opacity = '0.4';
          (el as HTMLElement).classList.add(`${APP_NAME}-pdf-mark`);

          // 给带评论的 mark 元素搭配一个图标。仅第一个 mark 元素会搭配这个图标
          if (annotation.body && i === 0 && j === marks.length - 1) {
            result.push({
              markEl: el as HTMLElement,
              annotation,
            });
          }
        }
      }
    }

    setAnnotationWithMark(result);

    onCleanup(() => {
      removeMarks(result.map(({ markEl }) => markEl));
    });
  });

  function handleOpenChange(annotation: AnnotationVO, value: boolean) {
    props.pdfViewer.annotationView.openStatusMap[annotation.id] = value;
  }

  return (
    <For each={annotationsWithMark()}>
      {({ annotation, markEl }) => (
        <AnnotationComment
          markEl={markEl}
          text={annotation.body}
          onOpenChange={action((value) => handleOpenChange(annotation, value))}
          defaultOpen={props.pdfViewer.annotationView.openStatusMap[annotation.id]}
        />
      )}
    </For>
  );
}
