import { SearchIcon } from 'lucide-solid';
import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

export default function FilterBox() {
  const { setKeyword } = container.resolve(Searcher);

  return (
    <label class="input flex items-center mb-stack-md shrink-0 w-full">
      <SearchIcon class="w-4 h-4 mr-stack-xs" />
      <input
        onCompositionEnd={(e) => setKeyword((e.target as HTMLInputElement).value)}
        onInput={(e) => !e.isComposing && setKeyword(e.target.value)}
        class="grow placeholder:text-text-tertiary"
        placeholder="搜索笔记"
      />
    </label>
  );
}
