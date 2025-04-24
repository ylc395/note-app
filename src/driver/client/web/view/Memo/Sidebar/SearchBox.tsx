import { SearchIcon } from 'lucide-solid';
import { action } from 'mobx';

import container from '#utils/singletonContainer';
import MemoList from '#domain/client/app/model/memo/List';

export default function SearchBox() {
  let keyword = '';
  const { filter } = container.resolve(MemoList);

  const search = action(() => {
    filter!.keyword = keyword;
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
