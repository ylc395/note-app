import { createMemo } from 'solid-js';
import { useContext } from './composables';
import assert from 'assert';
import NoteBaseEditor from '#domain/client/app/model/note/editor/BaseEditor';

export default function PreviewTip() {
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof NoteBaseEditor);

    return editor;
  });

  return (
    <div>
      <p>当前正在预览</p>
      <p>{editor().fileUploader?.file?.sourceUrl}</p>
      <div>
        <button onClick={() => editor().fileUploader?.upload.mutate()}>保存</button>
        <button onClick={() => editor().reload()}>返回</button>
      </div>
    </div>
  );
}
