import { FileXIcon } from 'lucide-solid';
import { useContext } from './composables';

export default function ErrorEditor() {
  const ctx = useContext()!;

  return (
    <div class="flex flex-col justify-center items-center h-full text-fg-secondary">
      <FileXIcon class="w-16 h-16 mb-2" />
      <h1 class="mb-16">加载失败</h1>
      <div class="text-sm text-center">
        <p>该笔记可能已经不再存在</p>
        <p>可尝试在回收站中查找</p>
        <p class="mt-6">ID: {ctx.editor.entityId}</p>
      </div>
    </div>
  );
}
