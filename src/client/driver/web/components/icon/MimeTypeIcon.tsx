import { BookOpenIcon, FileAudioIcon, FileVideoIcon, FileImageIcon, FileIcon } from 'lucide-react';
import { mimeTypes } from '@shared/domain/model/file';

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

  if (mimeType === mimeTypes.PDF) {
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
