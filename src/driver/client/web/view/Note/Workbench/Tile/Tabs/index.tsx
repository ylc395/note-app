import { For } from 'solid-js';

import Tile from '#domain/client/app/model/Workbench/Tile';
import Tab from './Tab';

export default function Tabs(props: { tile: Tile }) {
  return (
    <div class="flex overflow-auto border-b">
      <For each={props.tile.editors}>{(editor) => <Tab tile={props.tile} editor={editor} />}</For>
    </div>
  );
}
