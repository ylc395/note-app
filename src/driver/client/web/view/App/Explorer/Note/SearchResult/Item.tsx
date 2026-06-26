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
import type { EditorDTO } from '#domain/client/app/model/Workbench/BaseEditor/types';
import { EntityTypes } from '#domain/shared/model/entity';

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
    entityId: props.entityId,
    mimeType: props.mimeType,
    entityType: EntityTypes.Note,
  };

  return (
    <div
      class="py-2"
      onClick={() =>
        open(target, {
          focus: props.record.location.page ? { page: props.record.location.page } : undefined,
        })
      }
    >
      <div class="flex justify-between mb-2 text-fg-tertiary">
        <div>关联文件</div>
        <div>第 {props.record.location.page} 页</div>
      </div>
      <p class="text-fg-secondary break-all break-words">{highlight(props.record)}</p>
    </div>
  );
}

function AnnotationMatchRecordView(props: { record: AnnotationMatchRecord; mimeType: string; entityId: string }) {
  const { open } = container.resolve(Workbench);
  const target: EditorDTO = {
    entityId: props.entityId,
    mimeType: props.mimeType,
    entityType: EntityTypes.Note,
  };

  return (
    <div
      class="mt-2"
      onClick={() =>
        open(target, {
          focus:
            props.record.selector.type === 'PDFTextPositionSelector'
              ? { page: props.record.selector.position.startPage }
              : undefined,
        })
      }
    >
      <div class="flex justify-between mb-2 text-fg-tertiary">
        <div>标注</div>
        <Show when={props.record.selector.type === 'PDFTextPositionSelector'}>
          <div>第 {(props.record.selector as PDFTextPositionSelector).position.startPage} 页</div>
        </Show>
      </div>
      <p class="text-fg-secondary ">{highlight(props.record)}</p>
    </div>
  );
}

export default function Item(props: { open?: boolean; row: SearchResultVO; onToggle: (value: boolean) => void }) {
  const fileTextMatches = createMemo(() => {
    const [first, ...rest] = props.row.matches[SearchFields.File] || [];
    return { first, rest };
  });

  const bodyPreview = createMemo(() =>
    props.row.matches[SearchFields.Body] ? highlight(props.row.matches[SearchFields.Body]) : props.row.bodyPreview,
  );

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
    <Collapsible.RootProvider class="text-sm mb-2 group relative" value={collapsible}>
      <Collapsible.Trigger
        class="flex w-full pb-2 items-center sticky top-0 bg-bg-secondary"
        onClick={(e) => e.stopPropagation()}
      >
        <ChevronRightIcon class="size-4 group-data-[state=open]:rotate-90 mr-1" />
        <div class="shrink-0">
          {props.row.matches[SearchFields.Title] ? highlight(props.row.matches[SearchFields.Title]) : props.row.title}
        </div>
        <Show when={props.row.path.length > 1}>
          <div class="whitespace-pre text-xs text-fg-tertiary">
            /{props.row.path.map(({ title }) => title).join('/')}
          </div>
        </Show>
      </Collapsible.Trigger>
      <Collapsible.Content class="pl-6 space-y-2">
        <Show when={bodyPreview()}>
          <p class="text-fg-secondary">{bodyPreview()}</p>
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
          <Collapsible.Root unmountOnExit lazyMount>
            <Collapsible.Trigger class="flex items-center w-full mb-2">
              <Collapsible.Indicator class="group/others mr-1">
                <ChevronRightIcon class='size-4 group-data-[state="open"]/others:rotate-90' />
              </Collapsible.Indicator>
              其它{fileTextMatches().rest.length}页
            </Collapsible.Trigger>
            <Collapsible.Content class="pl-2 divide-border-accent-subtle divide-y">
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
