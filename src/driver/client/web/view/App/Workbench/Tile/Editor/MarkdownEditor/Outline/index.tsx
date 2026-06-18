import assert from 'assert';
import { createMemo, For, onCleanup, Show } from 'solid-js';
import { Collapsible } from '@ark-ui/solid';
import { ChevronDownIcon, ChevronRightIcon, HeadingIcon, LoaderCircleIcon } from 'lucide-solid';
import { isEqual } from 'lodash-es';
import { cx } from 'class-variance-authority';

import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import type { TocItem } from '#domain/client/app/model/Workbench/noteEditor/BaseEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';

import { useContext } from '../../composables';
import OutlineController from './Outline';

function TocNode(props: { item: TocItem; outline: OutlineController }) {
  const hasChildren = createMemo(() => !!props.item.children?.length);
  const indent = createMemo(() => (props.item.depth - 1) * 20);
  const isCurrent = createMemo(() => isEqual(props.outline.currentHeadingPosition, props.item.position));

  function handleClick() {
    props.outline.scrollIntoHeading(props.item.position);
  }

  return (
    <div style={{ 'padding-left': `${indent()}px` }}>
      <Show
        when={hasChildren()}
        fallback={
          <span onClick={handleClick} class={cx('pl-4 cursor-pointer', isCurrent() && 'font-semibold')}>
            {props.item.text}
          </span>
        }
      >
        <Collapsible.Root defaultOpen={true} lazyMount unmountOnExit>
          <div class="flex mb-1 cursor-pointer">
            <Collapsible.Trigger class="group flex items-center">
              <ChevronRightIcon class='group-data-[state="open"]:hidden w-4' />
              <ChevronDownIcon class='group-data-[state="closed"]:hidden w-4' />
            </Collapsible.Trigger>
            <span onClick={handleClick} class={cx(isCurrent() && 'font-semibold')}>
              {props.item.text}
            </span>
          </div>
          <Collapsible.Content>
            <For each={props.item.children}>{(child) => <TocNode item={child} outline={props.outline} />}</For>
          </Collapsible.Content>
        </Collapsible.Root>
      </Show>
    </div>
  );
}

export default function Outline(props: { editorViewModel: Editor }) {
  const { editor } = useContext()!;

  assert(editor instanceof MarkdownEditor);
  const isEmpty = createMemo(() => editor.toc?.length === 0);

  const outline = new OutlineController(props.editorViewModel);
  onCleanup(() => outline.destroy());

  return (
    <Show
      when={!isEmpty()}
      fallback={
        <div class="flex flex-col items-center justify-center h-full text-fg-tertiary gap-2 p-4">
          <HeadingIcon class="w-8 h-8 opacity-30" />
          <span class="text-sm">添加标题即可生成大纲</span>
        </div>
      }
    >
      <div class="h-full overflow-auto p-1">
        <For
          each={editor.toc}
          fallback={
            <div class="flex h-full justify-center items-center">
              <LoaderCircleIcon class="animate-spin" />
              <span>加载中</span>
            </div>
          }
        >
          {(item) => <TocNode item={item} outline={outline} />}
        </For>
      </div>
    </Show>
  );
}
