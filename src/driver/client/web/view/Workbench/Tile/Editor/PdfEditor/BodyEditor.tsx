import MarkdownEditor from '#web/components/MarkdownEditor';
import { useSplitterContext } from '@ark-ui/solid';
import { useContext } from '../context';
import { Show } from 'solid-js';

export default function BodyEditor(props: { id: string }) {
  const ctx = useContext()!;
  const splitter = useSplitterContext();

  function onUpdated(md: string) {
    if (ctx.editor.isCurrent) {
      ctx.editor.update({ body: md });
    }
  }

  return (
    <div {...splitter().getPanelProps({ id: props.id })}>
      <Show when={ctx.editor.value.data}>
        {(note) => (
          <MarkdownEditor
            className="border-r-border-primary border-r h-full"
            onUpdate={onUpdated}
            defaultValue={note().body}
          />
        )}
      </Show>
      ;
    </div>
  );
}
