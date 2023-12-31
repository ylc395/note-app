import clsx from 'clsx';

interface Props {
  value: boolean;
  trueText: string;
  falseText: string;
  onChange: (value: boolean) => void;
}

export default function Toggler({ value, onChange, trueText, falseText }: Props) {
  return (
    <div
      onClick={() => onChange(!value)}
      className="flex cursor-pointer space-x-1 rounded-md bg-gray-100 p-1 text-sm text-gray-400"
    >
      <div className={clsx('rounded-md px-2 py-1', value && 'bg-white text-gray-800 shadow-sm')}>{trueText}</div>
      <div className={clsx('rounded-md px-2 py-1', !value && 'bg-white text-gray-800 shadow-sm')}>{falseText}</div>
    </div>
  );
}
