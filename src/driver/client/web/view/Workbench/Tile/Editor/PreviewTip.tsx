import { useContext } from './context';

export default function PreviewTip() {
  const { editor } = useContext()!;

  return (
    <div>
      <p>当前正在预览</p>
      <p>{editor.sourceUrl}</p>
      <div>
        <button>保存</button>
        <button>返回</button>
      </div>
    </div>
  );
}
