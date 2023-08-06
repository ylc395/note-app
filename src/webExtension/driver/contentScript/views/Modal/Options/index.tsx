import TargetPath from './TargetPath';

export default function Options() {
  return (
    <div className="mt-4 flex items-center text-sm">
      <label className="mr-2">选择保存位置</label>
      <TargetPath />
    </div>
  );
}
