import { For, onMount } from 'solid-js';
import assert from 'assert';

import type { Digest } from '#domain/client/app/model/note/editor/PdfEditor/TextFinder';
import type PdfViewer from '../PDFViewer';

function DigestView(props: { digest: Digest; pdfViewer: PdfViewer; page: number }) {
  let rootRef: HTMLDivElement | undefined;

  function highlight() {
    const textNode = rootRef?.childNodes[0];
    assert(textNode);

    const markElement = document.createElement('mark');
    markElement.className = 'bg-yellow-100';

    const range = new Range();

    range.setStart(textNode, props.digest.matchIndex);
    range.setEnd(textNode, props.digest.matchIndex + props.digest.matchLength);
    range.surroundContents(markElement);
  }

  onMount(highlight);

  return (
    <div
      ref={rootRef}
      class="border break-words"
      onClick={() => props.pdfViewer.jumpTo(props.page)}
      classList={{
        'before:content-["..."]': props.digest.hasLeading,
        'before:mr-1': props.digest.hasLeading,
        'after:content-["..."]': props.digest.hasTrailing,
        'after:ml-1': props.digest.hasTrailing,
      }}
    >
      {props.digest.text}
    </div>
  );
}

export default function ResultList(props: { pdfViewer: PdfViewer }) {
  return (
    <div class="w-64 max-h-72 overflow-auto bg-white">
      <For each={props.pdfViewer.editor.textFinder.searchResult}>
        {(pageResult) => (
          <div>
            <div class="flex sticky top-0 bg-white">
              第{pageResult.page}页<span class="ml-2 border bg-gray-200">{pageResult.digests.length}</span>
            </div>
            <div class="space-y-1">
              <For each={pageResult.digests}>
                {(digest) => <DigestView pdfViewer={props.pdfViewer} page={pageResult.page} digest={digest} />}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
