import { createEffect, createSignal } from 'solid-js';
import { StepBackIcon, StepForwardIcon } from 'lucide-solid';
import type PdfViewer from '../PDFViewer';

export default function PageSwitcher(props: { viewer: PdfViewer }) {
  const [getValue, setValue] = createSignal<string>();

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key !== 'Enter') {
      return;
    }

    const result = props.viewer.jumpTo(Number(getValue()));

    if (!result) {
      setValue(String(props.viewer.currentPage));
    }
  }

  function handleInput(e: InputEvent) {
    setValue((e.target as HTMLInputElement).value);
  }

  createEffect(() => {
    setValue(String(props.viewer.currentPage));
  });

  return (
    <div class="flex space-x-2">
      <button class="flex items-center" onClick={() => props.viewer.goToPreviousPage()}>
        <StepBackIcon />
      </button>
      <input
        class="w-8"
        onBlur={() => setValue(String(props.viewer.currentPage))}
        onKeyPress={handleKeyPress}
        onInput={handleInput}
        value={getValue()}
      />
      /{props.viewer.totalPage}
      <button class="flex items-center" onClick={() => props.viewer.goToNextPage()}>
        <StepForwardIcon />
      </button>
    </div>
  );
}
