import { SearchIcon } from 'lucide-solid';

export default function SearchBox() {
  return (
    <label class="flex items-center w-full rounded-md bg-bg-tertiary px-2 mb-4 transition-colors focus-within:bg-bg-primary focus-within:border-border-accent border border-transparent">
      <SearchIcon class="w-4 h-4 mr-1.5 shrink-0 text-fg-tertiary" />
      <input
        placeholder="搜索 memo"
        class="block py-1.5 text-sm grow bg-transparent text-fg-primary placeholder:text-fg-tertiary outline-none"
      />
    </label>
  );
}
