import { createMemo, For, onMount } from 'solid-js';
import assert from 'assert';

import type { Digest } from '#domain/client/app/model/note/editor/PdfEditor/TextFinder';
import { useContext } from '../../context';

function DigestView(props: { digest: Digest; index: number }) {
  let rootRef: HTMLDivElement | undefined;
  const {
    viewer: { editor },
  } = useContext()!;

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
    <div class="border break-words" onClick={() => editor.textFinder.setCurrent(props.index)}>
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

export default function ResultList() {
  const {
    viewer: { editor },
  } = useContext()!;

  const digests = createMemo(() => {
    const result: { page: number; digests: Digest[]; totalCount: number }[] = [];

    for (const [i, pageDigests] of Object.entries(editor.textFinder.digests || [])) {
      result.push({
        ...pageDigests,
        totalCount: (result[Number(i) - 1]?.digests.length ?? 0) + (result[Number(i) - 1]?.totalCount ?? 0),
      });
    }

    return result;
  });

  return (
    <div class="w-64 max-h-72 overflow-auto bg-bg-primary">
      <For each={digests()}>
        {(pageResult) => (
          <div>
            <div class="flex sticky top-0 bg-bg-primary">
              第{pageResult.page}页<span class="ml-2 border bg-bg-tertiary">{pageResult.digests.length}</span>
            </div>
            <div class="space-y-1">
              <For each={pageResult.digests}>
                {(digest, index) => <DigestView index={pageResult.totalCount + index()} digest={digest} />}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
