import { Match, Switch } from 'solid-js';
import { LayoutGridIcon, GlobeIcon, NotebookTextIcon } from 'lucide-solid';
import data from '@emoji-mart/data';
import { init } from 'emoji-mart';
import { action, observable } from 'mobx';

import { MimeTypes } from '#domain/shared/model/file';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';
import type { Icon } from '#domain/shared/model/entity';

const dataLoaded = observable.box(false);
init({ data }).then(action(() => dataLoaded.set(true)));

export default function Icon(props: { icon?: Icon | null; mimeType?: string | null; className?: string }) {
  return (
    <Switch fallback={<NotebookTextIcon class={props.className} />}>
      <Match when={dataLoaded.get() && props.icon}>
        {(icon) => (
          <Switch>
            <Match when={icon().type === 'emoji'}>
              <em-emoji class={props.className} attr:shortcodes={icon()!.code}></em-emoji>
            </Match>
            <Match when={icon().type === 'file'}>
              <img class={props.className} src={getAppUrl(RouteTypes.File, icon()!.code)} />
            </Match>
          </Switch>
        )}
      </Match>
      <Match when={props.mimeType === MimeTypes.HTML}>
        <GlobeIcon class={props.className} />
      </Match>
      <Match when={props.mimeType}>
        <LayoutGridIcon class={props.className} />
      </Match>
    </Switch>
  );
}
