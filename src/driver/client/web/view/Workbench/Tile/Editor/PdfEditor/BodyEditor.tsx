import { useSplitterContext } from '@ark-ui/solid';
import { createSignal, Show } from 'solid-js';
import { EyeIcon } from 'lucide-solid';
import { action } from 'mobx';

import FloatingPanel from '#web/components/FloatingPanel';
import MarkdownEditor from '#web/components/MarkdownEditor';
import Resizable from '#web/components/Resizable';
import { useContext } from './context';

export default function BodyEditor(props: { id: string }) {
  const { viewer } = useContext()!;
  const editor = viewer.editor;
  const splitter = useSplitterContext();

  const uiState = editor.body.uiState;
  const [floatingSize, setFloatingSize] = createSignal(uiState.floatingSize || { width: 300, height: 500 });
  const [floatingPos, setFloatingPos] = createSignal(uiState.floatingPos || { x: 20, y: 20 });

  function onUpdated(md: string) {
    if (editor.isCurrent) {
      editor.update({ body: md });
    }
  }

  function handleMoveEnd(e: { x: number; y: number }) {
    uiState.floatingPos = e;
  }

  function handleResizeEnd(e: { width: number; height: number }) {
    uiState.floatingSize = e;
  }

  function toggleFloating() {
    uiState.isFloating = !uiState.isFloating;
  }

  return (
    <FloatingPanel.Main
      pos={floatingPos()}
      onMove={setFloatingPos}
      isEnabled={Boolean(editor.body.uiState.isFloating)}
      onMoveEnd={action(handleMoveEnd)}
    >
      <Resizable
        isEnabled={Boolean(editor.body.uiState.isFloating)}
        className="absolute"
        size={floatingSize()}
        onResize={setFloatingSize}
        onResizeEnd={action(handleResizeEnd)}
      >
        <div
          class="w-64 p-2 border-r flex flex-col overflow-auto"
          {...(!editor.body.uiState.isFloating ? splitter().getPanelProps({ id: props.id }) : null)}
        >
          <FloatingPanel.Handler>
            <div class="flex justify-between">
              <h4>笔记</h4>
              <div>
                <button class="flex items-center text-sm" onClick={action(toggleFloating)}>
                  <EyeIcon class="mr-1" />
                  悬浮
                </button>
              </div>
            </div>
          </FloatingPanel.Handler>
          <Show when={editor.value.data}>
            {(note) => (
              <MarkdownEditor
                className="border-r-border-primary border-r h-full grow"
                onUpdate={onUpdated}
                defaultValue={note().body}
              />
            )}
          </Show>
        </div>
      </Resizable>
    </FloatingPanel.Main>
  );
}
