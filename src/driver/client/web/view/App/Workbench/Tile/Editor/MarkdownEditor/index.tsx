import { createMemo, createSignal, Show } from 'solid-js';
import { Splitter, type SplitterResizeDetails } from '@ark-ui/solid';
import assert from 'assert';
import { action } from 'mobx';
import { FullscreenIcon, ListIcon, TextSearchIcon } from 'lucide-solid';

import BaseMarkdownEditor from '#web/view/components/MarkdownEditor';
import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import type Editor from '#web/view/components/MarkdownEditor/Editor';
import Button from '#web/view/components/Button';

import { useContext, useEditorBody } from '../composables';
import Empty from './Empty';
import Outline from './Outline';

export default function MarkdownEditorView() {
  const [getEditor, setEditor] = createSignal<Editor>();

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

  const toggleOutline = action(() => {
    uiState().outline.enabled = !uiState().outline.enabled;
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
          <Button size="small">
            <TextSearchIcon />
            查找
          </Button>
          <Button size="small">
            <FullscreenIcon />
            全屏
          </Button>
        </div>
        <Splitter.Root
          class="grow flex min-h-0"
          size={[uiState().outline.size, 100 - uiState().outline.size] as [number, number]}
          onResize={handleOutlineResize}
          panels={[
            { id: 'outline', minSize: 10 },
            { id: 'editor', minSize: 30 },
          ]}
        >
          <Show when={uiState().outline.enabled && getEditor()}>
            <Splitter.Panel id="outline">
              <Outline editorViewModel={getEditor()!} />
            </Splitter.Panel>
            <Splitter.ResizeTrigger class="w-1 bg-bg-tertiary" id="outline:editor" />
          </Show>
          <Splitter.Panel id="editor">
            <BaseMarkdownEditor
              ref={setEditor}
              className="h-full overflow-auto border-16 border-bg-primary"
              defaultValue={editorModel().content}
              initialScroll={uiState().scroll}
              initialCursorPos={uiState().cursorPos}
              readonly={editorModel().isUploading}
              onUpdate={updateBody}
              onScrollEnd={action(handleScrollEnd)}
              onSelectionUpdate={action(handleSelectionUpdate)}
            />
          </Splitter.Panel>
        </Splitter.Root>
        <Show when={!editorModel().content}>
          <Empty />
        </Show>
      </div>
    </Show>
  );
}
