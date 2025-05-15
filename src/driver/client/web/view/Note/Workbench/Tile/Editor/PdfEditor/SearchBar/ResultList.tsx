import { For, onMount } from 'solid-js';
import assert from 'assert';

import type { PageSearchResult, Digest } from '#domain/client/app/model/note/editor/PdfEditor/TextSearcher';

function DigestView(props: { digest: Digest }) {
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

export default function ResultList(props: { searchResult: PageSearchResult[] }) {
  return (
    <div class="w-64 max-h-72 overflow-auto bg-white">
      <For each={props.searchResult}>
        {(pageResult) => (
          <div>
            <div class="flex sticky top-0 bg-white">
              第{pageResult.page}页<span class="ml-2 border bg-gray-200">{pageResult.digests.length}</span>
            </div>
            <div class="space-y-1">
              <For each={pageResult.digests}>{(digest) => <DigestView digest={digest} />}</For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
