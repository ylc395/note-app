import type MemoView from '#domain/client/app/model/memo/MemoView';
import MarkdownEditor from '#web/view/components/MarkdownEditor';

export default function Editor(props: { memoView: MemoView }) {
  return (
    <div>
      <MarkdownEditor
        onUpdate={(value) => props.memoView.selfEditor!.update(value)}
        defaultValue={props.memoView.value!.body}
      />
      <div class="flex justify-end space-x-2 mt-2">
        <button class="text-sm text-gray-400" onclick={() => props.memoView.selfEditor!.destroy()}>
          取消
        </button>
        <button class="text-sm text-gray-400" onclick={() => props.memoView.selfEditor!.submit()}>
          提交
        </button>
      </div>
    </div>
  );
}
