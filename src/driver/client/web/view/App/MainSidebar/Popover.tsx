import type { JSX } from 'solid-js';

export default function Popover(props: { title: string; children: JSX.Element }) {
  return (
    <div class="bg-bg-secondary shadow-2xl rounded-xl px-2 py-4 text-sm w-64 border-border-primary border">
      <h2 class="font-bold pb-2 mb-2 text-base pl-2 border-b border-border-secondary">{props.title}</h2>
      {props.children}
    </div>
  );
}
