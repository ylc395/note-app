import { createEffect, createSignal } from 'solid-js';
import { StepBackIcon, StepForwardIcon } from 'lucide-solid';
import Button from '#web/view/components/Button';
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
    <div class="flex">
      <Button square onClick={() => viewer.goToPreviousPage()}>
        <StepBackIcon />
      </Button>
      <div class="flex items-center mx-1">
        <input
          class="w-8 text-end"
          onBlur={() => setValue(String(viewer.currentPage))}
          onKeyPress={handleKeyPress}
          onInput={handleInput}
          readOnly={!getValue()}
          value={getValue() ?? '-'}
        />
        <span class="mx-1">/</span>
        {viewer.totalPage ?? '-'}
      </div>
      <Button square onClick={() => viewer.goToNextPage()}>
        <StepForwardIcon />
      </Button>
    </div>
  );
}
