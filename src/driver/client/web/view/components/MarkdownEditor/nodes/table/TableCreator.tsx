import type { Ctx } from '@milkdown/kit/ctx';
import { insertTableCommand } from '@milkdown/kit/preset/gfm';
import { editorCtx } from '@milkdown/kit/core';
import { callCommand } from '@milkdown/kit/utils';
import { createEffect, createSignal, For } from 'solid-js';

import { useTooltip } from '../../shared/useTooltip';
import { useMilkdownEvent } from '../../shared/prosemirrorUtils';

export default function TableCreator(props: { ctx: Ctx; onClose: () => void }) {
  const [rows, setRows] = createSignal(2);
  const [cols, setCols] = createSignal(2);
  const [hoverCell, setHoverCell] = createSignal({ row: 2, col: 2 });

  const maxSize = 6;
  const { setTooltipEl } = useTooltip({
    ctx: props.ctx,
    reference: 'cursor',
    placement: 'bottom-start',
  });

  useMilkdownEvent({
    event: 'selectionUpdated',
    ctx: props.ctx,
    fn: props.onClose,
  });

  function handleCellClick(row: number, col: number) {
    setRows(row);
    setCols(col);
    submit();
  }

  function handleInputChange(e: Event, type: 'row' | 'col') {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value) || 1;
    const clampedValue = Math.max(1, Math.min(value, maxSize));

    if (type === 'row') {
      setRows(clampedValue);
    } else {
      setCols(clampedValue);
    }
  }

  function isCellHighlighted(row: number, col: number) {
    const hover = hoverCell();
    return row <= hover.row && col <= hover.col;
  }

  function getCellBgColor(row: number, col: number) {
    if (isCellHighlighted(row, col)) return 'bg-blue-300';
    return 'bg-gray-200';
  }

  function submit() {
    const result = props.ctx.get(editorCtx).action(callCommand(insertTableCommand.key, { row: rows(), col: cols() }));

    if (result) {
      props.onClose();
    }
  }

  createEffect(() => {
    setRows(hoverCell().row);
    setCols(hoverCell().col);
  });

  return (
    <div ref={setTooltipEl} class="p-3 flex flex-col gap-3">
      <div
        class="grid gap-0.5"
        style={{ 'grid-template-columns': `repeat(${maxSize}, 20px)` }}
        onMouseLeave={() => setHoverCell({ row: rows(), col: cols() })}
      >
        <For
          each={Array.from({ length: maxSize * maxSize }, (_, i) => ({
            row: Math.floor(i / maxSize) + 1,
            col: (i % maxSize) + 1,
          }))}
        >
          {({ row, col }) => (
            <div
              class={`w-5 h-5 border border-gray-300 rounded-sm cursor-pointer ${getCellBgColor(row, col)}`}
              onMouseEnter={() => setHoverCell({ row, col })}
              onClick={() => handleCellClick(row, col)}
            />
          )}
        </For>
      </div>
      <div class="flex items-center gap-2">
        <input
          type="number"
          value={rows()}
          min="1"
          max={maxSize}
          onInput={(e) => handleInputChange(e, 'row')}
          class="w-12 px-2 py-1 border border-gray-300 rounded"
        />
        <span>×</span>
        <input
          type="number"
          value={cols()}
          min="1"
          max={maxSize}
          onInput={(e) => handleInputChange(e, 'col')}
          class="w-12 px-2 py-1 border border-gray-300 rounded"
        />
        <span>表格</span>
      </div>
      <div>
        <button onClick={submit}>提交</button>
        <button onClick={props.onClose}>取消</button>
      </div>
    </div>
  );
}
