import { editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { createEffect, For, onMount } from 'solid-js';
import { CheckIcon, XIcon } from 'lucide-solid';
import {
  Combobox,
  useListCollection,
  useFilter,
  type ComboboxValueChangeDetails,
  type ComboboxInputValueChangeDetails,
  type ComboboxOpenChangeDetails,
} from '@ark-ui/solid';
import { createQuery } from 'mobx-tanstack-query/preset';

import { TopicVO } from '#domain/shared/model/topic';
import singletonContainer from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import Button from '#web/view/components/Button';

import { topicNode } from './node';
import { useTooltip } from '../../shared/useTooltip';

export default function Tooltip(props: { ctx: Ctx; onClose: () => void }) {
  const remote = singletonContainer.resolve(remoteToken);
  const filter = useFilter({});
  let inputRef: HTMLInputElement | undefined;
  let value = '';

  const collection = useListCollection<TopicVO>({
    itemToString: (topic) => topic.name,
    itemToValue: (topic) => topic.name,
    initialItems: [],
    filter: filter().contains,
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
    onCursorChange: props.onClose,
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

  function handleItemSelect(e: ComboboxValueChangeDetails) {
    value = e.value[0]!;
    submit();
  }

  function handleInputChange(e: ComboboxInputValueChangeDetails) {
    value = e.inputValue;
    collection.filter(e.inputValue);
  }

  function handleOpenChange(e: ComboboxOpenChangeDetails) {
    if (!e.open && e.reason === 'escape-key') {
      props.onClose();
    }
  }

  function handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div
      ref={setTooltipEl}
      class="bg-surface-raised border border-border-primary rounded-lg shadow-lg min-w-[240px] overflow-hidden"
    >
      <Combobox.Root
        allowCustomValue
        open
        collection={collection.collection()}
        onValueChange={handleItemSelect}
        onInputValueChange={handleInputChange}
        onOpenChange={handleOpenChange}
      >
        <Combobox.Control class="flex items-center border-b border-border-secondary px-2">
          <Combobox.Input
            placeholder="输入话题"
            ref={inputRef}
            onKeyPress={handleKeypress}
            class="flex-1 px-2 py-2 text-sm text-fg-primary placeholder:text-fg-tertiary outline-none bg-transparent"
          />
          <div class="flex items-center gap-0.5">
            <Button intent="secondary" size="small" square onClick={submit}>
              <CheckIcon />
            </Button>
            <Button intent="secondary" size="small" square onClick={props.onClose}>
              <XIcon />
            </Button>
          </div>
        </Combobox.Control>
        <Combobox.Content class="max-h-60 overflow-y-auto bg-surface-raised">
          <For each={collection.collection().items}>
            {(topic) => (
              <Combobox.Item
                item={topic}
                class="px-3 py-2 text-sm text-fg-primary cursor-pointer hover:bg-bg-hover data-[highlighted]:bg-bg-accent-subtle"
              >
                <span>{topic.name}</span>
                <span class="text-fg-tertiary ml-1">({topic.entities.length})</span>
              </Combobox.Item>
            )}
          </For>
        </Combobox.Content>
      </Combobox.Root>
    </div>
  );
}
