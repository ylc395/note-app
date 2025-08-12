import { SearchIcon } from 'lucide-solid';

export default function FilterBox() {
  return (
    <label class="input flex items-center mb-stack-md shrink-0 w-full">
      <SearchIcon class="w-4 h-4 mr-stack-xs" />
      <input class="grow" placeholder="搜索笔记" />
    </label>
  );
}
