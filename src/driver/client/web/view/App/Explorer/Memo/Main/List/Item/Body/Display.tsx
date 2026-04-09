import { micromark } from 'micromark';
import { createMemo } from 'solid-js';

import { tokenExtension } from '#domain/shared/infra/markdown/syntax/topic';
import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function Display(props: { memoView: MemoView }) {
  const markdown = createMemo(() => {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(
      micromark(props.memoView.value!.body, {
        extensions: [tokenExtension],
      }),
      'text/html',
    );

    return doc.body.innerHTML;
  });

  return <div class="select-text text-fg-primary" innerHTML={markdown()} />;
}
