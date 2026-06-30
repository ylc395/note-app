import { SearchIcon } from 'lucide-solid';
import { action } from 'mobx';

import { useContext } from './context';

export default function SearchBox() {
  let keyword = '';
  const { memoList } = useContext()!;

  const search = action(() => {
    memoList.filter.keyword = keyword;
  });

  return (
    <div class="flex border py-1 px-2 mb-4">
      <SearchIcon />
      <input
        class="outline-none grow"
        onInput={(e) => (keyword = e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            search();
          }
        }}
      />
    </div>
  );
}
