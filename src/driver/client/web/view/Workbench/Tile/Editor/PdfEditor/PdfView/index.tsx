import { createEffect, createMemo, createSignal, onCleanup, Show, splitProps } from 'solid-js';
import assert from 'assert';
import { Key } from '@solid-primitives/keyed';
import { identity } from 'lodash-es';

import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import PDFViewer from './PDFViewer';
import Toolbar from './Toolbar';
import Outline from './OutlineList';
import SearchBar from './SearchBar';
import SvgEditorBar from './SvgEditorBar';
import SelectionTooltip from './SelectionTooltip';
import AnnotationLayer from './AnnotationLayer';
import TextLayer from './TextLayer';
import './style.css';
import { useContext } from '../../context';

export default function PdfEditorView(props: Record<string, unknown>) {
  const ctx = useContext()!;
  const [_, restProps] = splitProps(props, ['editor']);

  const editor = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    return ctx.editor;
  });

  const [getPdfViewer, setPdfViewer] = createSignal<PDFViewer>();
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;

  const isOutlineVisible = createMemo(() => {
    return editor().outline.uiState?.panelVisible;
  });

  createEffect(() => {
    assert(containerRef && viewRef);

    const viewer = new PDFViewer({
      container: containerRef,
      viewer: viewRef,
      editor: editor(),
    });

    setPdfViewer(viewer);
    onCleanup(() => viewer.destroy());
  });

  return (
    <div class="grow flex flex-col min-h-0" {...restProps}>
      <Show when={getPdfViewer()}>{(viewer) => <Toolbar viewer={viewer()} />}</Show>
      <div class="grow flex min-h-0 overflow-hidden">
        <Show when={isOutlineVisible() && getPdfViewer()}>{(viewer) => <Outline viewer={viewer()} />}</Show>
        <div class="grow flex flex-col">
          <Show when={editor().textFinder.isEnabled && getPdfViewer()}>
            {(pdfViewer) => <SearchBar textFinder={pdfViewer().textFinder} />}
          </Show>
          <Show when={editor().svgEditor.isEnabled}>
            <SvgEditorBar svgEditor={editor().svgEditor} />
          </Show>
          <div
            class="relative grow overflow-hidden"
            classList={{ invisible: !getPdfViewer()?.isReady }} // ready 后才渲染，防止自动滚动的过程破坏体验
            data-drawing-mode={editor().svgEditor.isEnabled ? editor().svgEditor.mode : ''}
          >
            <div
              class="absolute inset-0 overflow-auto pdfViewer" /* pdfViewer 这个类名来自 pdf_viewer.css */
              ref={containerRef}
            >
              <div classList={{ 'select-text': !editor().svgEditor.isEnabled }} ref={viewRef}></div>
              <Show when={getPdfViewer()}>{(viewer) => <SelectionTooltip pdfViewer={viewer()} />}</Show>
              <div data-custom-layer>
                <Show when={getPdfViewer()?.isReady && getPdfViewer()}>
                  {(pdfViewer) => (
                    <Key each={pdfViewer().renderedPages} by={identity}>
                      {(page) => (
                        <>
                          <AnnotationLayer page={page()} pdfViewer={pdfViewer()} />
                          <TextLayer page={page()} pdfViewer={pdfViewer()} />
                        </>
                      )}
                    </Key>
                  )}
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
