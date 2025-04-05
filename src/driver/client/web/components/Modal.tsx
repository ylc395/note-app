import { Dialog, type DialogOpenChangeDetails } from '@ark-ui/solid/dialog';
import { type JSXElement, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { XIcon } from 'lucide-solid';

export default function Modal(props: {
  open: boolean;
  onClose?: () => void;
  children: JSXElement;
  title: string;
  closeOnInteractOutside?: boolean;
}) {
  function handleOpenChange({ open }: DialogOpenChangeDetails) {
    if (!open) {
      props.onClose?.();
    }
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      closeOnInteractOutside={props.closeOnInteractOutside}
      open={props.open}
      onOpenChange={handleOpenChange}
    >
      <Show when={props.open}>
        <Portal mount={document.getElementById(import.meta.env.VITE_WEB_ROOT_ID)!}>
          <Dialog.Backdrop class="fixed inset-0 bg-black opacity-30 z-10" />
          <Dialog.Positioner class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Dialog.Content class="bg-white p-4 rounded-lg">
              <div class="flex justify-between pb-2 mb-4 border-b">
                <Dialog.Title class="text-lg">{props.title}</Dialog.Title>
                <Dialog.CloseTrigger>
                  <XIcon />
                </Dialog.CloseTrigger>
              </div>
              {props.children}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Show>
    </Dialog.Root>
  );
}
