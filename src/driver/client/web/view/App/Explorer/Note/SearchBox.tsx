import { SearchIcon, XIcon } from 'lucide-solid';
import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';
import Button from '#web/view/components/Button';
import { Show } from 'solid-js';

export default function SearchBox() {
  const searcher = container.resolve(Searcher);
  let isComposing = false;

  function handleCompositionStart() {
    isComposing = true;
  }

  function handleCompositionEnd(e: CompositionEvent) {
    isComposing = false;
    searcher.setKeyword((e.target as HTMLInputElement).value);
  }

  function handleSearchInput(e: InputEvent) {
    if (isComposing) {
      return;
    }

    const keyword = (e.target as HTMLInputElement).value;
    searcher.setKeyword(keyword);
  }

  return (
    <label class="flex items-center w-full rounded-md bg-bg-tertiary px-2 mb-4">
      <SearchIcon class="w-4 h-4 mr-1 shrink-0" />
      <input
        placeholder="搜索笔记"
        class="block py-1.5 text-sm grow text-fg-primary placeholder:text-fg-tertiary border border-transparent "
        value={searcher.keyword}
        onInput={handleSearchInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      <Show when={searcher.keyword}>
        <Button square size="tiny" class="shrink-0" onClick={() => searcher.setKeyword('')}>
          <XIcon />
        </Button>
      </Show>
    </label>
  );
}
