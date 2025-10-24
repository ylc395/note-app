export function encodeIcon(type: 'emoji', value: string) {
  return `${type}:${value}`;
}

export function decodeIcon(type: 'emoji', value: string) {
  return value.replace(/^emoji:/, '');
}
