import { extendListItemSchemaForTask } from '@milkdown/kit/preset/gfm';
import { wrapIn } from '@milkdown/kit/prose/commands';
import { $command } from '@milkdown/kit/utils';

export const wrapInTaskListCommand = $command(
  'WrapInTaskList',
  (ctx) => (attr?: { listType?: 'ordered' | 'bullet' }) =>
    wrapIn(extendListItemSchemaForTask.type(ctx), { checked: false, ...attr }),
);
