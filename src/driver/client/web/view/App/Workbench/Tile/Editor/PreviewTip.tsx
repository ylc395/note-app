import { useContext } from './context';

export default function PreviewTip() {
  const { editor } = useContext()!;

  return (
    <div>
      <p>当前正在预览</p>
      <p>{editor.fileUploader?.file?.sourceUrl}</p>
      <div>
        <button onClick={() => editor.fileUploader?.upload.mutate()}>保存</button>
        <button onClick={() => editor.reload()}>返回</button>
      </div>
    </div>
  );
}
