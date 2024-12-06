import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

import type { ToastConfig } from '#domain/client/shared/infra/ui';

const notyf = new Notyf({
  ripple: false,
  position: { x: 'center', y: 'top' },
  dismissible: true,
});

export default function toast(params: ToastConfig) {
  const method = params.type === 'success' ? 'success' : 'error';

  notyf[method]({
    message: params.text,
  });
}
