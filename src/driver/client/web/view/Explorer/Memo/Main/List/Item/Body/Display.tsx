import { micromark } from 'micromark';
import { createMemo } from 'solid-js';

import { htmlExtension, tokenExtension } from '#domain/shared/infra/markdown/syntax/topic';
import type MemoView from '#domain/client/app/model/memo/MemoView';
import MemoList from '#domain/client/app/model/memo/List';
import { container } from '#domain/shared/infra/singletons';

export default function Display(props: { memoView: MemoView }) {
  const {
    filter: { topicList },
  } = container.resolve(MemoList);

  const markdown = createMemo(() => {
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(
      micromark(props.memoView.value!.body, {
        extensions: [tokenExtension],
        htmlExtensions: [htmlExtension],
      }),
      'text/html',
    );

    const topicElements = Array.from(doc.querySelectorAll('.markdown-topic')) as HTMLElement[];
    const topicElementGroup = Object.groupBy(topicElements, (el) => el.dataset.markdownTopic!);

    for (const topic of topicList.selectedTopics) {
      const elements = topicElementGroup[topic] || [];

      for (const element of elements) {
        element.classList.add('bg-yellow-300');
      }
    }

    return doc.body.innerHTML;
  });

  return <div class="select-text text-gray-800" innerHTML={markdown()} />;
}
