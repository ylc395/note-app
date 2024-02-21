import { AiOutlineArrowUp, AiOutlineArrowDown, AiOutlineClose } from 'react-icons/ai';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import type { SearchState } from './type';
import Button from '@web/components/Button';

interface Props {
  onChange: (keyword: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  searchState: SearchState;
}

export default observer(function SearchBox({ onChange, onNext, onPrevious, onClose, searchState }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <input ref={inputRef} onChange={(e) => onChange(e.target.value)} />
      <span>
        {searchState.ranges.length > 0 ? `${searchState.activeIndex + 1} / ${searchState.ranges.length}` : '无结果'}
      </span>
      <div>
        <Button onClick={onPrevious}>
          <AiOutlineArrowUp />
        </Button>
        <Button onClick={onNext}>
          <AiOutlineArrowDown />
        </Button>
        <Button onClick={onClose}>
          <AiOutlineClose />
        </Button>
      </div>
    </>
  );
});
