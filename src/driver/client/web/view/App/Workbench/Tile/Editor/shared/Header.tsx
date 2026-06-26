import type { JSX } from 'solid-js';

import FloatingPanel from '#web/view/components/FloatingPanel';

export default function Header(props: { title: string; children?: JSX.Element }) {
  return (
    <FloatingPanel.Handler
      asChild={(handlerProps) => (
        <div {...handlerProps()} class="bg-bg-secondary flex items-center px-3 py-2 box-border h-8">
          <h4 class="flex items-center gap-2 text-sm font-medium">{props.title}</h4>
          <div class="flex items-center justify-end grow">{props.children}</div>
        </div>
      )}
    />
  );
}
