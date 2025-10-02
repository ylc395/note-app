import { FileTextIcon, LayoutGridIcon, GlobeIcon } from 'lucide-solid';
import { MimeTypes } from '#domain/shared/model/file';

export default function Icon({
  icon,
  mimeType,
  iconClassName,
}: {
  icon?: string | null;
  mimeType?: string | null;
  iconClassName?: string;
}) {
  if (icon) {
    return null; // todo: 改成图标
  }

  if (!mimeType) {
    return <FileTextIcon class={iconClassName} />;
  }

  switch (mimeType) {
    case MimeTypes.HTML:
      return <GlobeIcon class={iconClassName} />;
    default:
      return <LayoutGridIcon class={iconClassName} />;
  }
}
