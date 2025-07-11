import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import assert from 'assert';
import { Key } from '@solid-primitives/keyed';
import { identity } from 'lodash-es';

import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import PDFViewer from './PDFViewer';
import Toolbar from './Toolbar';
import Outline from './OutlineList';
import AnnotationList from './AnnotationList';
import SearchBar from './SearchBar';
import SvgEditorBar from './SvgEditorBar';
import SelectionTooltip from './SelectionTooltip';
import AnnotationLayer from './AnnotationLayer';
import TextLayer from './TextLayer';
import './style.css';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  let containerRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;
  const [getPdfViewer, setPdfViewer] = createSignal<PDFViewer>();

  const isOutlineVisible = createMemo(() => {
    return props.editor.outline.state.isReady && props.editor.outline.state.get('panelVisible');
  });

  const isAnnotationVisible = createMemo(() => {
    return props.editor.annotation.state.isReady && props.editor.annotation.state.get('panelVisible');
  });

  createEffect(() => {
    assert(containerRef && viewRef);

    const viewer = new PDFViewer({
      container: containerRef,
      viewer: viewRef,
      editor: props.editor,
    });

    setPdfViewer(viewer);
    onCleanup(() => viewer.destroy());
  });

  return (
    <div class="grow flex flex-col min-h-0">
      <Show when={getPdfViewer()}>{(viewer) => <Toolbar viewer={viewer()} />}</Show>
      <div class="grow flex min-h-0 overflow-hidden">
        <Show when={isOutlineVisible() && getPdfViewer()}>{(viewer) => <Outline viewer={viewer()} />}</Show>
        <div class="grow flex flex-col">
          <Show when={props.editor.textFinder.isEnabled && getPdfViewer()}>
            {(pdfViewer) => <SearchBar textFinder={pdfViewer().textFinder} />}
          </Show>
          <Show when={props.editor.annotation.svgEditor.isEnabled}>
            <SvgEditorBar svgEditor={props.editor.annotation.svgEditor} />
          </Show>
          <div
            class="relative grow overflow-hidden"
            classList={{ invisible: !getPdfViewer()?.isReady }} // ready 后才渲染，防止自动滚动的过程破坏体验
            data-drawing-mode={
              props.editor.annotation.svgEditor.isEnabled ? props.editor.annotation.svgEditor.mode : ''
            }
          >
            <div
              class="absolute inset-0 overflow-auto pdfViewer" /* pdfViewer 这个类名来自 pdf_viewer.css */
              ref={containerRef}
            >
              <div classList={{ 'select-text': !props.editor.annotation.svgEditor.isEnabled }} ref={viewRef}></div>
              <Show when={getPdfViewer()}>{(viewer) => <SelectionTooltip pdfViewer={viewer()} />}</Show>
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
        <Show when={isAnnotationVisible() && getPdfViewer()}>
          {(viewer) => <AnnotationList pdfViewer={viewer()} />}
        </Show>
      </div>
    </div>
  );
}
