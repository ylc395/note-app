import { SearchIcon } from 'lucide-solid';
import { action } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';

export default function SearchBox() {
  let keyword = '';
  const { filter } = container.resolve(MemoList);

  const search = action(() => {
    filter!.keyword = keyword;
  });

  return (
    <div class="flex border mr-4 py-1 px-2 mb-4">
      <input
        class="outline-none"
        onInput={(e) => (keyword = e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            search();
          }
        }}
      />
      <SearchIcon />
    </div>
  );
}
