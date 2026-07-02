import { LoaderCircleIcon } from 'lucide-solid';

export default function Loading() {
  return (
    <div class="flex justify-center my-6 text-fg-tertiary">
      <LoaderCircleIcon class="animate-spin mr-2" size={24} />
      加载中...
    </div>
  );
}
