import { editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { posToDOMRect } from '@milkdown/kit/prose';
import { createEffect, For } from 'solid-js';
import { CheckIcon, XIcon } from 'lucide-solid';
import { Combobox, useListCollection } from '@ark-ui/solid';
import { createQuery } from 'mobx-tanstack-query/preset';

import { TopicVO } from '#domain/shared/model/topic';
import singletonContainer from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';

import { topicNode } from './node';
import { useSelectionChanged, useTooltip } from '../../shared/useTooltip';

export default function Tooltip(props: { targetDom?: HTMLElement; ctx: Ctx; onClose: () => void }) {
  const remote = singletonContainer.resolve(remoteToken);
  const editorView = props.ctx.get(editorViewCtx);
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
    requestAnimationFrame(() => {
      inputRef?.focus();
    });
  });

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: props.targetDom || {
      contextElement: editorView.dom,
      getBoundingClientRect: () =>
        posToDOMRect(editorView, editorView.state.selection.anchor, editorView.state.selection.anchor),
    },
    placement: 'bottom-start',
  });

  useSelectionChanged({
    ctx: props.ctx,
    fn: props.onClose,
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
    props.onClose?.();
  }

  return (
    <div class="absolute border" ref={setTooltipEl}>
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
            <button onClick={props.onClose}>
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
