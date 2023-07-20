import { APP_PROTOCOL } from '../infra/constants';

export function getFileIdFromUrl(url: string) {
  const match = url.match(new RegExp(`^${APP_PROTOCOL}://files/(.+)`));
  return match?.[1];
}
