import { createEffect, createMemo, For, Show, type JSX } from 'solid-js';
import { Collapsible, useCollapsible } from '@ark-ui/solid';
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
import type { EditorDTO } from '#domain/client/app/model/Workbench/EditorFactory';

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
  const target: EditorDTO = {
    noteId: props.entityId,
    mimeType: props.mimeType,
  };

  return (
    <div class="mt-stack-s w-full" onClick={() => open(target)}>
      <div class="flex justify-between mb-stack-s text-text-tertiary">
        <div>关联文件</div>
        <div>第 {props.record.location.page} 页</div>
      </div>
      <p class="text-text-secondary break-all break-words">{highlight(props.record)}</p>
    </div>
  );
}

function AnnotationMatchRecordView(props: { record: AnnotationMatchRecord; mimeType: string; entityId: string }) {
  const { open } = container.resolve(Workbench);
  const target: EditorDTO = {
    noteId: props.entityId,
    mimeType: props.mimeType,
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

export default function Item(props: { open?: boolean; row: SearchResultVO; onToggle: (value: boolean) => void }) {
  const { open } = container.resolve(Workbench);
  const fileTextMatches = createMemo(() => {
    const [first, ...rest] = props.row.matches[SearchFields.File] || [];
    return { first, rest };
  });

  const collapsible = useCollapsible({
    defaultOpen: true,
    onOpenChange: (e) => props.onToggle(e.open),
  });

  createEffect(() => {
    if (typeof props.open === 'boolean') {
      collapsible().setOpen(props.open);
    }
  });

  return (
    <Collapsible.RootProvider class="text-sm mb-stack-s group" value={collapsible}>
      <div
        class="flex space-x-inset-square-md items-center"
        onClick={() => open({ noteId: props.row.id, mimeType: props.row.file?.mimeType || null })}
      >
        <Collapsible.Trigger onClick={(e) => e.stopPropagation()}>
          <ChevronRightIcon class="group-data-[state=open]:rotate-90" />
        </Collapsible.Trigger>
        <div class="shrink-0">
          {props.row.matches[SearchFields.Title] ? highlight(props.row.matches[SearchFields.Title]) : props.row.title}
        </div>
        <div class="whitespace-pre text-xs text-text-tertiary">
          /{props.row.path.map(({ title }) => title).join('/')}
        </div>
      </div>
      <Collapsible.Content class="pl-stack-md">
        <p class="text-text-secondary">
          {(props.row.matches[SearchFields.Body]
            ? highlight(props.row.matches[SearchFields.Body])
            : props.row.bodyPreview) || '无内容'}
        </p>
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
          <Collapsible.Root unmountOnExit lazyMount>
            <Collapsible.Trigger class="flex items-center mt-stack-s w-full">
              <Collapsible.Indicator class="group/others">
                <ChevronRightIcon class='group-data-[state="open"]/others:rotate-90' />
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
      </Collapsible.Content>
    </Collapsible.RootProvider>
  );
}
