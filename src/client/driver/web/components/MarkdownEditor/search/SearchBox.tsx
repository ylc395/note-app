import { Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, CloseOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import type { SearchState } from './type';

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
      <Button.Group>
        <Button onClick={onPrevious} type="text" icon={<ArrowUpOutlined />} />
        <Button onClick={onNext} type="text" icon={<ArrowDownOutlined />} />
        <Button onClick={onClose} type="text" icon={<CloseOutlined />} />
      </Button.Group>
    </>
  );
});
