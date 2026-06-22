import { createMemo, createSignal, Show } from 'solid-js';
import { Splitter, type SplitterResizeDetails } from '@ark-ui/solid';
import assert from 'assert';
import { action } from 'mobx';
import { ListIcon, TextSearchIcon } from 'lucide-solid';

import BaseMarkdownEditor from '#web/view/components/MarkdownEditor';
import type { SearchChangeInfo } from '#web/view/components/MarkdownEditor/search/SearchBar';
import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';
import Button from '#web/view/components/Button';

import { useContext, useEditorBody } from '../composables';
import Empty from './Empty';
import Outline from './Outline';

export default function MarkdownEditorView() {
  const [getEditor, setEditor] = createSignal<Editor>();
  const [containerRef, setContainerRef] = createSignal<HTMLElement | null>(null);

  const editorModel = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  const { updateBody } = useEditorBody(getEditor);
  const uiState = createMemo(() => editorModel().uiState!);

  function handleScrollEnd(e: { x: number; y: number }) {
    uiState().scroll = e;
  }

  function handleSelectionUpdate(pos: { anchor: number; head: number }) {
    uiState().cursorPos = pos;
  }

  function handleSearchChange(info: SearchChangeInfo) {
    uiState().search = {
      ...uiState().search,
      ...info,
    };
  }

  const toggleOutline = action(() => {
    uiState().outline.enabled = !uiState().outline.enabled;
  });

  const toggleSearch = action(() => {
    uiState().search = {
      ...uiState().search,
      enabled: !uiState().search?.enabled,
    };
  });

  const handleOutlineResize = action(({ size }: SplitterResizeDetails) => {
    uiState().outline.size = size[0]!;
  });

  return (
    <Show when={editorModel().isReady}>
      <div class="min-h-0 flex flex-col grow overflow-hidden">
        <div class="flex py-2 pl-2 pr-4 border-b border-border-secondary space-x-1">
          <Button size="small" onClick={toggleOutline} selected={uiState().outline.enabled}>
            <ListIcon />
            大纲
          </Button>
          <Button size="small" selected={uiState().search?.enabled} onClick={toggleSearch}>
            <TextSearchIcon />
            查找
          </Button>
        </div>
        <Splitter.Root
          ref={setContainerRef}
          class="grow flex min-h-0 relative"
          size={[uiState().outline.size, 100 - uiState().outline.size] as [number, number]}
          onResize={handleOutlineResize}
          panels={[
            { id: 'outline', minSize: 10 },
            { id: 'editor', minSize: 30 },
          ]}
        >
          <Show when={uiState().outline.enabled && getEditor()}>
            <Outline editorViewModel={getEditor()!} id="outline" floatingBoundary={containerRef} />
            <Show when={!uiState().outline.isFloating}>
              <Splitter.ResizeTrigger class="w-1 bg-bg-tertiary" id="outline:editor" />
            </Show>
          </Show>
          <Splitter.Panel id="editor" class="relative">
            <BaseMarkdownEditor
              ref={setEditor}
              className="h-full overflow-auto border-16 border-bg-primary"
              defaultValue={editorModel().content}
              defaultSearchOptions={uiState().search}
              initialScroll={uiState().scroll}
              initialCursorPos={uiState().cursorPos}
              readonly={editorModel().isUploading}
              onUpdate={updateBody}
              onScrollEnd={action(handleScrollEnd)}
              onSelectionUpdate={action(handleSelectionUpdate)}
              onSearchChange={action(handleSearchChange)}
              onSearchClose={toggleSearch}
              showSearch={uiState().search?.enabled}
            />
            <Show when={!editorModel().content}>
              <Empty />
            </Show>
          </Splitter.Panel>
        </Splitter.Root>
      </div>
    </Show>
  );
}
