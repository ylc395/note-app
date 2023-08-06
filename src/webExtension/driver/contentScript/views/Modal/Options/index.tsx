import TargetPath from './TargetPath';

export default function Options() {
  return (
    <div className="flex items-center text-sm">
      <label>选择保存位置</label>
      <TargetPath />
    </div>
  );
}
