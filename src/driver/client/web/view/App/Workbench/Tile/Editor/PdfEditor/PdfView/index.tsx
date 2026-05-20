import { createEffect, createMemo, onCleanup, Show } from 'solid-js';
import { identity, intersection } from 'lodash-es';
import { Key } from '@solid-primitives/keyed';
import { cx } from 'class-variance-authority';
import { LoaderCircleIcon } from 'lucide-solid';

import SearchBar from './SearchBar';
import SvgEditorBar from './SvgEditorBar';
import SelectionTooltip from './SelectionTooltip';
import { useContext } from '../context';
import useTextRender from './useTextRender';
import AnnotationLayer from './AnnotationLayer';
import './style.css';

export default function PdfEditorView(props: Record<string, unknown>) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;
  const { viewer: pdfViewer } = useContext()!;
  const textRenderedPages = useTextRender();

  const annotationPages = createMemo(() => {
    return intersection(Object.keys(pdfViewer.editor.annotation.pages).map(Number), textRenderedPages());
  });

  createEffect(() => {
    pdfViewer.init({
      view: viewRef!,
      container: containerRef!,
    });
  });

  onCleanup(() => {
    pdfViewer.destroy();
  });

  return (
    <div class="relative grow flex min-h-0 overflow-hidden flex-col" {...props}>
      <Show when={pdfViewer.editor.textFinder.isEnabled}>
        <SearchBar />
      </Show>
      <Show when={pdfViewer.editor.svgEditor.isEnabled}>
        <SvgEditorBar />
      </Show>
      <Show when={!pdfViewer.viewer.isReady}>
        <div class="absolute inset-0 flex items-center justify-center">
          <LoaderCircleIcon class="animate-spin mr-2" />
          加载中
        </div>
      </Show>
      <div
        class={cx('relative grow overflow-hidden', !pdfViewer.viewer.isReady && 'invisible')}
        data-display-text={pdfViewer.editor.texts.displayText}
        data-drawing-mode={pdfViewer.editor.svgEditor.isEnabled ? pdfViewer.editor.svgEditor.mode : ''}
      >
        <div
          class="absolute inset-0 overflow-auto pdfViewer" /* pdfViewer 这个类名来自 pdf_viewer.css */
          ref={containerRef}
        >
          <div classList={{ 'select-text': !pdfViewer.editor.svgEditor.isEnabled }} ref={viewRef}></div>
        </div>
        <Show when={!pdfViewer.editor.svgEditor.isEnabled}>
          <SelectionTooltip />
        </Show>
        {/* 提示：不要试图用 Portal 把东西挂载到 pdf.js 渲染出的页面里 */}
        <Show when={annotationPages().length > 0}>
          <div data-app-annotations>
            <Key by={identity} each={annotationPages()}>
              {(page) => <AnnotationLayer page={page()} />}
            </Key>
          </div>
        </Show>
      </div>
    </div>
  );
}
