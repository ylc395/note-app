import { SearchIcon } from 'lucide-solid';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

export default function FilterBox() {
  const { search } = container.resolve(NoteService);

  return (
    <label class="input flex items-center mb-stack-md shrink-0 w-full">
      <SearchIcon class="w-4 h-4 mr-stack-xs" />
      <input
        onInput={(e) => search({ keyword: e.target.value })}
        class="grow placeholder:text-text-tertiary"
        placeholder="搜索笔记"
      />
    </label>
  );
}
