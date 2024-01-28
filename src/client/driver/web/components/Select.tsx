import { container } from 'tsyringe';
import { token } from '@shared/domain/infra/ui';
import { useRef } from 'react';
import assert from 'assert';
import clsx from 'clsx';

interface Props {
  className?: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; key: string }[];
}

export default function Select({ className, value, options, onChange }: Props) {
  const ui = container.resolve(token);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const handleClick = async () => {
    assert(rootRef.current);
    const { bottom, left } = rootRef.current.getBoundingClientRect();
    const key = await ui.getActionFromMenu(options, { x: left, y: bottom + 6 });

    if (key !== null) {
      onChange(key);
    }
  };

  const valueText = options.find(({ key }) => key === value)?.label ?? value;

  return (
    <div className={clsx(className, 'flex items-center')} ref={rootRef}>
      <span onClick={handleClick} className="mx-auto my-0 cursor-pointer overflow-hidden text-ellipsis">
        {valueText}
      </span>
    </div>
  );
}
