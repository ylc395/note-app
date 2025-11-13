import { createMemo, For, Show, type JSX } from 'solid-js';
import { Collapsible } from '@ark-ui/solid';
import { ChevronRightIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import {
  SearchFields,
  type AnnotationMatchRecord,
  type FileMatchRecord,
  type MatchRecord,
  type SearchResultVO,
} from '#domain/shared/model/search';
import Workbench from '#domain/client/app/model/Workbench';
import type { PDFTextPositionSelector } from '#domain/shared/model/annotation';
import { goToAnnotationCommand, goToPageCommand } from '#domain/client/app/model/note/editor/command';

function highlight({ text, highlights }: MatchRecord) {
  const htmls: JSX.Element[] = [];

  let previous: { start: number; end: number } | undefined;

  for (const range of highlights) {
    htmls.push(text.slice(previous ? previous.end : 0, range.start), <mark>{text.slice(range.start, range.end)}</mark>);
    previous = range;
  }

  htmls.push(text.slice(previous!.end));
  return htmls;
}

function FileMatchRecordView(props: { record: FileMatchRecord; entityId: string; mimeType: string }) {
  const { open } = container.resolve(Workbench);
  const target = {
    entityId: props.entityId,
    mimeType: props.mimeType,
    initialCommand:
      typeof props.record.location.page === 'number' ? goToPageCommand.create(props.record.location.page) : undefined,
  };

  return (
    <div class="mt-stack-s" onClick={() => open(target)}>
      <div class="flex justify-between mb-stack-s text-text-tertiary">
        <div>关联文件</div>
        <div>第 {props.record.location.page} 页</div>
      </div>
      <p class="text-text-secondary ">{highlight(props.record)}</p>
    </div>
  );
}

function AnnotationMatchRecordView(props: { record: AnnotationMatchRecord; mimeType: string; entityId: string }) {
  const { open } = container.resolve(Workbench);
  const target = {
    entityId: props.entityId,
    mimeType: props.mimeType,
    initialCommand: goToAnnotationCommand.create(props.record.id),
  };

  return (
    <div class="mt-stack-s" onClick={() => open(target)}>
      <div class="flex justify-between mb-stack-s text-text-tertiary">
        <div>标注</div>
        <Show when={props.record.selector.type === 'PDFTextPositionSelector'}>
          <div>第 {(props.record.selector as PDFTextPositionSelector).position.startPage} 页</div>
        </Show>
      </div>
      <p class="text-text-secondary ">{highlight(props.record)}</p>
    </div>
  );
}

export default function Item(props: { ref?: HTMLDetailsElement; onToggle: (v: boolean) => void; row: SearchResultVO }) {
  const fileTextMatches = createMemo(() => {
    const [first, ...rest] = props.row.matches[SearchFields.File] || [];
    return { first, rest };
  });

  const bodySnippet = createMemo(() =>
    props.row.matches[SearchFields.Body] ? highlight(props.row.matches[SearchFields.Body]) : props.row.bodyPreview,
  );

  return (
    <details
      open
      class="text-sm mb-stack-s group"
      ref={props.ref}
      // 这个方法在初始化的时候就会被调用一次
      onToggle={(e) => props.onToggle((e.target as HTMLDetailsElement).open)}
    >
      <summary class="flex space-x-inset-square-md items-center">
        <ChevronRightIcon class="group-open:rotate-90" />
        <div class="shrink-0">
          {props.row.matches[SearchFields.Title] ? highlight(props.row.matches[SearchFields.Title]) : props.row.title}
        </div>
        <div class="whitespace-pre text-xs text-text-tertiary">
          /{props.row.path.map(({ title }) => title).join('/')}
        </div>
      </summary>
      <div class="pl-stack-md">
        <Show when={bodySnippet()}>
          <p class="text-text-secondary">{bodySnippet()}</p>
        </Show>
        <Show when={props.row.matches[SearchFields.Annotation]}>
          {(records) => (
            <For each={records()}>
              {(record) => (
                <AnnotationMatchRecordView
                  record={record}
                  entityId={props.row.id}
                  mimeType={props.row.file!.mimeType}
                />
              )}
            </For>
          )}
        </Show>
        <Show when={fileTextMatches().first}>
          {(record) => (
            <FileMatchRecordView record={record()} entityId={props.row.id} mimeType={props.row.file!.mimeType} />
          )}
        </Show>
        <Show when={fileTextMatches().rest.length > 0}>
          {/* 这里就不用 details 元素了，避免被折叠元素真的被渲染出来 */}
          <Collapsible.Root unmountOnExit lazyMount>
            <Collapsible.Trigger class="flex items-center mt-stack-s">
              <Collapsible.Indicator class="group">
                <ChevronRightIcon class='group-data-[state="open"]:rotate-90' />
              </Collapsible.Indicator>
              其它{fileTextMatches().rest.length}页
            </Collapsible.Trigger>
            <Collapsible.Content class="pl-stack-s">
              <For each={fileTextMatches().rest}>
                {(record) => (
                  <FileMatchRecordView record={record} entityId={props.row.id} mimeType={props.row.file!.mimeType} />
                )}
              </For>
            </Collapsible.Content>
          </Collapsible.Root>
        </Show>
      </div>
    </details>
  );
}
