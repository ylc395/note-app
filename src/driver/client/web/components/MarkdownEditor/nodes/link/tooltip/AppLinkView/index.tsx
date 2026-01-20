import { RouteTypes, type parseAppUrl } from '#domain/shared/infra/url';
import { Match, Switch } from 'solid-js';

export default function AppLinkView(props: {
  appUrl: NonNullable<ReturnType<typeof parseAppUrl>>;
  targetDom: HTMLAnchorElement;
  mousePosition: { x: number; y: number };
  onLeave: () => void;
  onEnter: () => void;
  onClose: () => void;
}) {
  return null;
}
