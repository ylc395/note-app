import type { JSXElement } from 'solid-js';
import HistoryNavigationButtonGroup from './HistoryNavigationButtonGroup';

export default function Header(props: { children?: JSXElement; title: string }) {
  return (
    <div class="flex items-center mb-2">
      <h1 class="font-bold text-fg-primary">{props.title}</h1>
      <div class="relative grow h-full flex justify-end">
        {props.children}
        <HistoryNavigationButtonGroup />
      </div>
    </div>
  );
}
