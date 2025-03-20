import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';

export default function BackAndForward() {
  return (
    <div class="flex items-center space-x-2 text-sm">
      <button class="flex items-center">
        <ArrowLeftIcon />
      </button>
      <button class="flex items-center">
        <ArrowRightIcon />
      </button>
    </div>
  );
}
