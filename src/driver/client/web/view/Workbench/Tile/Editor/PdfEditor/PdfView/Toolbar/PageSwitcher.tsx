import { createEffect, createSignal } from 'solid-js';
import { StepBackIcon, StepForwardIcon } from 'lucide-solid';
import { useContext } from '../context';

export default function PageSwitcher() {
  const {
    viewer: { viewer },
  } = useContext()!;

  const [getValue, setValue] = createSignal<string>();

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key !== 'Enter') {
      return;
    }

    const result = viewer.jumpTo(Number(getValue()));

    if (!result) {
      setValue(String(viewer.currentPage));
    }
  }

  function handleInput(e: InputEvent) {
    setValue((e.target as HTMLInputElement).value);
  }

  createEffect(() => {
    setValue(viewer.currentPage ? String(viewer.currentPage) : undefined);
  });

  return (
    <div class="flex space-x-2">
      <button class="flex items-center" onClick={() => viewer.goToPreviousPage()}>
        <StepBackIcon />
      </button>
      <input
        class="w-8"
        onBlur={() => setValue(String(viewer.currentPage))}
        onKeyPress={handleKeyPress}
        onInput={handleInput}
        readOnly={!getValue()}
        value={getValue() ?? '-'}
      />
      /{viewer.totalPage ?? '-'}
      <button class="flex items-center" onClick={() => viewer.goToNextPage()}>
        <StepForwardIcon />
      </button>
    </div>
  );
}
