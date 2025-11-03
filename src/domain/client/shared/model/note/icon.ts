type IconType = 'emoji' | 'file';

export function encodeIcon(type: IconType, value: string) {
  return `${type}:${value}`;
}

export function decodeIcon(value: string): { type: IconType; code: string } | null {
  if (value.startsWith('emoji:')) {
    return {
      type: 'emoji',
      code: value.replace(/^emoji:/, ''),
    };
  }

  if (value.startsWith('file:')) {
    return {
      type: 'file',
      code: value.replace(/^file:/, ''),
    };
  }

  return null;
}
