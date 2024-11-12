import { BookOpenIcon, FileAudioIcon, FileVideoIcon, FileImageIcon, FileIcon } from 'lucide-react';
import { MimeTypes } from '#domain/shared/model/file';

export default function MimeTypeIcon({
  mimeType,
  className,
  size,
}: {
  mimeType: string;
  size?: string;
  className?: string;
}) {
  if (mimeType.includes('audio')) {
    return <FileAudioIcon className={className} size={size} />;
  }

  if (mimeType === MimeTypes.PDF) {
    return <BookOpenIcon className={className} size={size} />;
  }

  if (mimeType.includes('video')) {
    return <FileVideoIcon className={className} size={size} />;
  }

  if (mimeType.includes('image')) {
    return <FileImageIcon className={className} size={size} />;
  }

  return <FileIcon className={className} size={size} />;
}
