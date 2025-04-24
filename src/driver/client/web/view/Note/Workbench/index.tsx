import { Show } from 'solid-js';
import { Splitter } from '@ark-ui/solid';
import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';

import TileNode from './TileNode';

export default function WorkbenchView(props: { panelId: string }) {
  const workbench = container.resolve(Workbench);

  return (
    // 这个 Splitter.Panel 是和 sidebar 对应的
    <Splitter.Panel id={props.panelId} class="flex flex-col">
      <Show when={workbench.root} fallback={<div class="grow">empty</div>}>
        {(tile) => <TileNode tile={tile()} />}
      </Show>
    </Splitter.Panel>
  );
}
