import { SearchIcon } from 'lucide-solid';

export default function SearchBox() {
  return (
    <div class="flex border py-1 px-2 mb-4">
      <SearchIcon />
      <input class="outline-none grow" />
    </div>
  );
}
