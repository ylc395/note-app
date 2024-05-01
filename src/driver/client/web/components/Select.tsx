import { useRef, useState } from 'react';
import { useBoolean } from 'ahooks';
import assert from 'assert';
import clsx from 'clsx';

import Menu from './Menu';

interface Props {
  className?: string;
  value: string | number;
  onChange: (v: string | number) => void;
  options: Array<{ label: string; value: string | number }>;
}

export default function Select({ className, value, options, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const [isOpen, { setFalse: close, setTrue: open }] = useBoolean(false);

  const handleClick = async () => {
    assert(rootRef.current);

    const { bottom, left } = rootRef.current.getBoundingClientRect();
    setPosition({ x: left, y: bottom + 6 });
    open();
  };

  const selected = options.find((item) => 'key' in item && item.key === value);
  const valueText = selected && 'label' in selected ? selected.label : value;

  return (
    <div className={clsx(className, 'flex items-center')} ref={rootRef}>
      <span onClick={handleClick} className="mx-auto my-0 cursor-pointer overflow-hidden text-ellipsis">
        {valueText}
      </span>
      <Menu
        native
        items={options.map(({ label, value }) => ({ label, onSelect: () => onChange(value) }))}
        position={position}
        isOpen={isOpen}
        onClose={close}
      />
    </div>
  );
}
