import { SearchIcon } from 'lucide-solid';

export default function FilterBox() {
  return (
    <label class="input input-sm mb-2 shrink-0">
      <SearchIcon class="w-4 h-4" />
      <input type="search" placeholder="搜索笔记" />
    </label>
  );
}
