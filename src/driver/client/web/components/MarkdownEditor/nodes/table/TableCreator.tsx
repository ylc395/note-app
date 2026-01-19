import type { Ctx } from '@milkdown/kit/ctx';
import { insertTableCommand } from '@milkdown/kit/preset/gfm';
import { editorCtx } from '@milkdown/kit/core';
import { callCommand } from '@milkdown/kit/utils';

import { useSelectionChanged, useTooltip } from '../../shared/useTooltip';

export default function TableCreator(props: { ctx: Ctx; onClose: () => void }) {
  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: 'cursor',
    placement: 'bottom-start',
  });

  useSelectionChanged({
    ctx: props.ctx,
    fn: props.onClose,
  });

  function submit() {
    const result = props.ctx.get(editorCtx).action(callCommand(insertTableCommand.key, { row: 2, col: 2 }));

    if (result) {
      props.onClose();
    }
  }

  return (
    <div ref={setTooltipEl}>
      <div>
        <input /> * <input />
      </div>
      <div>
        <button onClick={submit}>提交</button>
      </div>
    </div>
  );
}
