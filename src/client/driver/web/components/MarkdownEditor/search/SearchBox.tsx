import { Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';

interface Props {
  onChange: (keyword: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  searchState: {
    total: number;
    activeIndex: number;
  };
}

export default observer(function SearchBox({ onChange, onNext, onPrevious, searchState }: Props) {
  return (
    <>
      <input onChange={(e) => onChange(e.target.value)} />
      <span>{searchState.total > 0 ? `${searchState.activeIndex + 1} / ${searchState.total}` : '无结果'}</span>
      <Button.Group>
        <Button onClick={onPrevious} type="text" icon={<ArrowUpOutlined />} />
        <Button onClick={onNext} type="text" icon={<ArrowDownOutlined />} />
      </Button.Group>
    </>
  );
});
