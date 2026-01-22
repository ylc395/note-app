import { editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { createEffect, For, onMount } from 'solid-js';
import { CheckIcon, XIcon } from 'lucide-solid';
import { Combobox, useListCollection } from '@ark-ui/solid';
import { createQuery } from 'mobx-tanstack-query/preset';

import { TopicVO } from '#domain/shared/model/topic';
import singletonContainer from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';

import { topicNode } from './node';
import { useTooltip } from '../../shared/useTooltip';
import { useMilkdownEvent } from '../../shared/prosemirrorUtils';

export default function Tooltip(props: { ctx: Ctx; onClose: () => void }) {
  const remote = singletonContainer.resolve(remoteToken);
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

  onMount(() => {
    requestAnimationFrame(() => {
      inputRef?.focus();
    });
  });

  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: 'cursor',
    placement: 'bottom-start',
  });

  useMilkdownEvent({
    event: 'selectionUpdated',
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
    <div class="border" ref={setTooltipEl}>
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
