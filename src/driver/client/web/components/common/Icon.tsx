import { Match, Switch } from 'solid-js';
import { FileTextIcon, LayoutGridIcon, GlobeIcon } from 'lucide-solid';
import data from '@emoji-mart/data';
import { init } from 'emoji-mart';
import { observable } from 'mobx';

import { MimeTypes } from '#domain/shared/model/file';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';
import type { Icon } from '#domain/shared/model/entity';

const dataLoaded = observable.box(false);
init({ data }).then(() => dataLoaded.set(true));

export default function Icon(props: { icon?: Icon | null; mimeType?: string | null; iconClassName?: string }) {
  return (
    <Switch fallback={<FileTextIcon class={props.iconClassName} />}>
      <Match when={dataLoaded.get() && props.icon}>
        {(icon) => (
          <Switch>
            <Match when={icon().type === 'emoji'}>
              <em-emoji class={props.iconClassName} attr:shortcodes={icon()!.code}></em-emoji>
            </Match>
            <Match when={icon().type === 'file'}>
              <img class={props.iconClassName} src={getAppUrl(RouteTypes.File, icon()!.code)} />
            </Match>
          </Switch>
        )}
      </Match>
      <Match when={props.mimeType === MimeTypes.HTML}>
        <GlobeIcon class={props.iconClassName} />
      </Match>
      <Match when={props.mimeType === MimeTypes.HTML}>
        <GlobeIcon class={props.iconClassName} />
      </Match>
      <Match when={props.mimeType}>
        <LayoutGridIcon class={props.iconClassName} />
      </Match>
    </Switch>
  );
}
