import { Show } from 'solid-js';
import { Splitter } from '@ark-ui/solid';
import Workbench from '#domain/client/app/model/Workbench';
import container from '#utils/singletonContainer';

import TileNode from './TileNode';
import Welcome from './Welcome';

export default function WorkbenchView(props: { panelId: string }) {
  const workbench = container.resolve(Workbench);

  return (
    <Splitter.Panel id={props.panelId} class="flex flex-col">
      <Show when={workbench.root} fallback={<Welcome />}>
        {(tile) => <TileNode tile={tile()} />}
      </Show>
    </Splitter.Panel>
  );
}
