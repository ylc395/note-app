import { Dialog, type DialogOpenChangeDetails } from '@ark-ui/solid/dialog';
import type { JSXElement } from 'solid-js';
import { Portal } from 'solid-js/web';

export default function Modal(props: { open: boolean; onClose: () => void; children: JSXElement }) {
  function handleOpenChange({ open }: DialogOpenChangeDetails) {
    if (!open) {
      props.onClose();
    }
  }

  return (
    <Dialog.Root lazyMount unmountOnExit open={props.open} onOpenChange={handleOpenChange}>
      <Portal mount={document.getElementById(import.meta.env.VITE_WEB_ROOT_ID)!}>
        <Dialog.Backdrop class="fixed inset-0 bg-black opacity-30 z-10" />
        <Dialog.Positioner class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          {props.children}
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
