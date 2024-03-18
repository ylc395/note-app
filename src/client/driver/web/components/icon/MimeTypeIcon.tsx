import {
  AiOutlineFilePdf,
  AiOutlineAudio,
  AiOutlineVideoCamera,
  AiOutlineFileImage,
  AiOutlineFile,
} from 'react-icons/ai';
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
    return <AiOutlineAudio className={className} size={size} />;
  }

  if (mimeType === mimeTypes.PDF) {
    return <AiOutlineFilePdf className={className} size={size} />;
  }

  if (mimeType.includes('video')) {
    return <AiOutlineVideoCamera className={className} size={size} />;
  }

  if (mimeType.includes('image')) {
    return <AiOutlineFileImage className={className} size={size} />;
  }

  return <AiOutlineFile className={className} size={size} />;
}
