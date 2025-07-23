import assert from 'assert';
import { action } from 'mobx';
import { createEffect, createMemo, onCleanup, on, onMount } from 'solid-js';
import { debounce } from 'lodash-es';
import { SVG, type Element } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.resize.js';
import '@svgdotjs/svg.select.js';
import '@svgdotjs/svg.draggable.js';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import SvgAnnotationEditor, { Mode } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import type PdfViewer from '../PDFViewer';

export default function SvgAnnotation(props: {
  annotation: AnnotationVO;
  page: number;
  viewBox: { width: number; height: number };
  pdfViewer: PdfViewer;
}) {
  const svg = createMemo(() => {
    assert(props.annotation.selector.type === 'PDFSvgSelector');
    return SVG(props.annotation.selector.svg)
      .children()
      .map((el) => el.svg())
      .join('');
  });

  let groupRef: SVGGElement | undefined;
  let $el: Element | undefined;

  const update = debounce(() => {
    assert(groupRef);
    props.pdfViewer.editor.annotation.update(
      props.annotation.id,
      SvgAnnotationEditor.toSvgSelector(props.viewBox, props.page, groupRef.innerHTML),
    );
  }, 500);

  createEffect(
    on(
      [
        () => props.pdfViewer.editor.annotation.svgEditor.isEnabled,
        () => props.pdfViewer.editor.annotation.svgEditor.mode,
        svg,
      ],
      ([isEnabled, mode]) => {
        const _$el = groupRef?.children[0] && SVG(groupRef.children[0]);
        $el = _$el;

        if (!(isEnabled && mode === Mode.Select && _$el)) {
          return;
        }

        const svgEditor = props.pdfViewer.editor.annotation.svgEditor;
        let timerId: ReturnType<typeof setTimeout> | undefined;
        let isDragging = false;

        _$el
          .draggable()
          .on('dragmove', () => {
            timerId && clearTimeout(timerId);
            isDragging = true;
          })
          .on('dragend', () => {
            // 哪怕没有 move 过，这事件还是会触发。此时不要进行后续操作
            if (!isDragging) {
              return;
            }

            timerId = setTimeout(() => {
              isDragging = false;
            }, 100);

            update();
          })
          .on(
            'click',
            action((e) => {
              if (!svgEditor.selectedSvg.has(props.annotation.id) && !isDragging) {
                if (!(e as MouseEvent).metaKey) {
                  svgEditor.selectedSvg.clear();
                }

                _$el.select().resize();
                svgEditor.selectedSvg.add(props.annotation.id);
              }
            }),
          )
          .on('resize', update);

        if (svgEditor.selectedSvg.has(props.annotation.id)) {
          _$el.select().resize();
        }

        onCleanup(() => {
          _$el.draggable(false).select(false).resize(false).off();
          update.flush();
        });
      },
    ),
  );

  createEffect(() => {
    if (!props.pdfViewer.editor.annotation.svgEditor.selectedSvg.has(props.annotation.id)) {
      $el?.select(false).resize(false);
    }
  });

  onMount(
    action(() => {
      assert(groupRef);
      props.pdfViewer.annotationElementMap.set(props.annotation.id, groupRef);
    }),
  );

  onCleanup(
    action(() => {
      props.pdfViewer.annotationElementMap.delete(props.annotation.id);
    }),
  );

  return <g ref={groupRef} data-annotation-id={props.annotation.id} innerHTML={svg()}></g>;
}
