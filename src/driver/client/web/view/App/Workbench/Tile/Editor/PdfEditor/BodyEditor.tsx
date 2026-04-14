import { useSplitterContext } from '@ark-ui/solid';
import { createSignal, Show } from 'solid-js';
import { PinOffIcon } from 'lucide-solid';
import { action } from 'mobx';
import { partialRight } from 'lodash-es';

import FloatingPanel from '#web/view/components/FloatingPanel';
import MarkdownEditor from '#web/view/components/MarkdownEditor';
import Resizable from '#web/view/components/Resizable';
import { useContext } from './context';
import Button from '#web/view/components/Button';
import { cx } from 'class-variance-authority';

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

  function handleMove(pos: { x: number; y: number }, start?: boolean) {
    if (start) {
      uiState.isFloating = true;
    }
    setFloatingPos(pos);
  }

  function cancelFloating() {
    uiState.isFloating = false;
  }

  return (
    <FloatingPanel.Main
      pos={floatingPos()}
      onMoveStart={action(partialRight(handleMove, true))}
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
          class={cx(
            'w-64 p-2 border-border-primary flex flex-col overflow-auto bg-surface-raised',
            uiState.isFloating ? 'border' : 'border-r',
          )}
          {...(!editor.body.uiState.isFloating ? splitter().getPanelProps({ id: props.id }) : null)}
        >
          <FloatingPanel.Handler>
            <div class="flex justify-between items-center">
              <h4>笔记</h4>
              <div>
                <Show when={uiState.isFloating}>
                  <Button size="small" onClick={action(cancelFloating)}>
                    <PinOffIcon class="mr-1" />
                    取消悬浮
                  </Button>
                </Show>
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
