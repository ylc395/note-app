import { FileXIcon } from 'lucide-solid';
import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';

export default function ErrorEditor(props: { editor: BaseEditor }) {
  return (
    <div class="flex flex-col justify-center items-center h-full text-text-secondary">
      <FileXIcon class="w-16 h-16 mb-2" />
      <h1 class="mb-16">加载失败</h1>
      <div class="text-sm text-center">
        <p>该笔记可能已经不再存在</p>
        <p>可尝试在回收站中查找</p>
        <p class="mt-6">ID: {props.editor.noteId}</p>
      </div>
    </div>
  );
}
