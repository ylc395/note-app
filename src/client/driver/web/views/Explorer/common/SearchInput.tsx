import { CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import { useToggle } from 'ahooks';
import { container } from 'tsyringe';

import SearchService from '@domain/app/service/SearchService';
import type { SearchableEntityType } from '@shared/domain/model/search';

import Button from '@web/components/Button';

interface Props {
  entityType: SearchableEntityType;
}

export default (function SearchInput({ entityType }: Props) {
  const { searchInTree } = container.resolve(SearchService);
  const [keyword, setKeyword] = useState('');
  const [containBody, { toggle: toggleContainBody }] = useToggle(false);
  const inputRef = useRef<null | HTMLInputElement>(null);

  const clearKeyword = () => {
    inputRef.current!.value = '';
    setKeyword('');
  };

  useEffect(() => {
    searchInTree({
      type: entityType,
      keyword,
      containBody,
    });
  }, [keyword, containBody, searchInTree, entityType]);

  return (
    <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded border border-solid border-gray-200 bg-white  focus-within:border-blue-600">
      <input
        ref={inputRef}
        className="grow border-0 p-2 text-sm placeholder:text-gray-400 "
        placeholder="Type to filter"
        onInput={(e) => setKeyword((e.target as HTMLInputElement).value)}
      />
      <div className="mr-2">
        <Button size="small" onClick={toggleContainBody} selected={containBody} className="opacity-70">
          <FileTextOutlined />
        </Button>
        {keyword.length > 0 && (
          <Button size="small" onClick={clearKeyword} className="opacity-70">
            <CloseOutlined />
          </Button>
        )}
      </div>
    </div>
  );
});
