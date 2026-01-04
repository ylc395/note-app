import { autoUpdate, computePosition, flip, hide } from '@floating-ui/dom';
import { editorViewCtx, rootCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { posToDOMRect } from '@milkdown/kit/prose';
import { createEffect, For, onCleanup } from 'solid-js';
import { CheckIcon, XIcon } from 'lucide-solid';
import { Combobox, useListCollection } from '@ark-ui/solid';
import { createQuery } from 'mobx-tanstack-query/preset';

import { TopicVO } from '#domain/shared/model/topic';
import singletonContainer from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';

import { topicNode } from './node';

export default function Tooltip(props: { targetDom?: HTMLElement; ctx: Ctx; onDestroy: () => void }) {
  const remote = singletonContainer.resolve(remoteToken);
  let root: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;
  let value = '';

  const collection = useListCollection<TopicVO>({
    itemToString: (topic) => topic.name,
    itemToValue: (topic) => topic.name,
    initialItems: [],
  });

  const topics = createQuery(() => remote.content.queryTopics.query(), {
    queryKey: ['topics'],
  });

  createEffect(() => {
    if (topics.data) {
      collection.set(topics.data);
    }
  });

  createEffect(() => {
    if (!root) {
      return;
    }

    const editorView = props.ctx.get(editorViewCtx);
    const { anchor } = editorView.state.selection;
    const reference = props.targetDom || { getBoundingClientRect: () => posToDOMRect(editorView, anchor, anchor) };

    const dispose = autoUpdate(reference, root, async () => {
      const boundary = props.ctx.get(rootCtx) as HTMLElement;
      const { x, y, middlewareData } = await computePosition(reference, root, {
        middleware: [hide({ boundary, strategy: 'escaped' }), flip({ boundary })],
        placement: 'bottom-start',
      });

      Object.assign(root.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: middlewareData.hide?.escaped ? 'none' : '',
      });
    });

    onCleanup(dispose);
  });

  createEffect(() => {
    requestAnimationFrame(() => {
      inputRef?.focus();
    });
  });

  function submit() {
    if (!value) {
      return;
    }

    const editorView = props.ctx.get(editorViewCtx);

    editorView.dispatch(
      editorView.state.tr.insert(
        editorView.state.selection.anchor,
        topicNode.type(props.ctx).createAndFill({ value })!,
      ),
    );

    editorView.focus();
    props.onDestroy?.();
  }

  return (
    <div class="absolute border" ref={root}>
      <Combobox.Root
        allowCustomValue
        alwaysSubmitOnEnter
        open
        collection={collection.collection()}
        onInputValueChange={(e) => (value = e.inputValue)}
        onSubmit={submit}
      >
        <Combobox.Control class="flex">
          <Combobox.Input onKeyPress={(e) => e.code === 'Enter' && submit()} placeholder="输入话题" ref={inputRef} />
          <div>
            <button onClick={submit}>
              <CheckIcon />
            </button>
            <button onClick={props.onDestroy}>
              <XIcon />
            </button>
          </div>
        </Combobox.Control>
        <Combobox.Content>
          <For each={collection.collection().items}>
            {(topic) => <Combobox.Item item={topic}>{topic.name}</Combobox.Item>}
          </For>
        </Combobox.Content>
      </Combobox.Root>
    </div>
  );
}
