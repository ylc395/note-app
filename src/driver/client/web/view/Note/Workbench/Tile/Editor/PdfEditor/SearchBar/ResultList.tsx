import { For, onMount } from 'solid-js';
import assert from 'assert';
import { sumBy } from 'lodash-es';

import type { Digest } from '#domain/client/app/model/note/editor/PdfEditor/TextFinder';
import type Searcher from './Searcher';

function DigestView(props: { digest: Digest; searcher: Searcher; index: number }) {
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
    <div class="border break-words" onClick={() => props.searcher.jumpTo(props.index)}>
      <span>{props.index + 1}</span>
      <p
        ref={rootRef}
        classList={{
          'before:content-["..."]': props.digest.hasLeading,
          'before:mr-1': props.digest.hasLeading,
          'after:content-["..."]': props.digest.hasTrailing,
          'after:ml-1': props.digest.hasTrailing,
        }}
      >
        {props.digest.text}
      </p>
    </div>
  );
}

export default function ResultList(props: { searcher: Searcher }) {
  return (
    <div class="w-64 max-h-72 overflow-auto bg-white">
      <For each={props.searcher.textFinder.digests}>
        {(pageResult, index) => {
          const totalCount = sumBy(props.searcher.textFinder.digests?.slice(0, index()), (page) => page.digests.length);

          return (
            <div>
              <div class="flex sticky top-0 bg-white">
                第{pageResult.page}页<span class="ml-2 border bg-gray-200">{pageResult.digests.length}</span>
              </div>
              <div class="space-y-1">
                <For each={pageResult.digests}>
                  {(digest, index) => (
                    <DigestView index={totalCount - 1 + index()} searcher={props.searcher} digest={digest} />
                  )}
                </For>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
