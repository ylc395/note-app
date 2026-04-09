import { SearchIcon } from 'lucide-solid';
import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

export default function FilterBox(props: { onSearchManually?: () => void }) {
  const { setKeyword, search } = container.resolve(Searcher);

  function searchManually() {
    search(true);
    props.onSearchManually?.();
  }

  return (
    <label class="input flex items-center shrink-0 w-full">
      <SearchIcon class="w-4 h-4 mr-1" />
      <input
        onKeyDown={(e) => e.key === 'Enter' && searchManually()}
        onCompositionEnd={(e) => setKeyword((e.target as HTMLInputElement).value)}
        onInput={(e) => !e.isComposing && setKeyword(e.target.value)}
        class="grow placeholder:text-fg-tertiary"
        placeholder="搜索笔记"
      />
    </label>
  );
}
