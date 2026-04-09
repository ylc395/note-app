import { Dialog, type DialogOpenChangeDetails } from '@ark-ui/solid/dialog';
import { type JSXElement, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { XIcon } from 'lucide-solid';
import shell from '#web/infra/shell';

export default function Modal(props: {
  open: boolean;
  onClose?: () => void;
  children: JSXElement;
  title: string;
  bottom?: JSXElement;
  onConfirm?: () => void;
  canConfirm?: boolean;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
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
        <Portal mount={shell.appRoot}>
          <Dialog.Backdrop class="fixed inset-0 bg-black opacity-30 z-10" />
          <Dialog.Positioner class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Dialog.Content class="bg-bg-primary p-6 rounded-lg w-md">
              <div class="flex justify-between pb-3 mb-4 border-b border-border-secondary">
                <Dialog.Title class="text-lg">{props.title}</Dialog.Title>
                <Dialog.CloseTrigger class="button">
                  <XIcon />
                </Dialog.CloseTrigger>
              </div>
              {props.children}
              <Show
                when={props.bottom}
                fallback={
                  <div class="mt-6 text-right space-x-4 flex justify-end">
                    <button class="button  button-lg" onClick={props.onCancel}>
                      {props.cancelText ?? '取 消'}
                    </button>
                    <button
                      class="button button-primary button-lg"
                      disabled={props.canConfirm}
                      onClick={props.onConfirm}
                    >
                      {props.confirmText ?? '确 认'}
                    </button>
                  </div>
                }
              >
                {props.bottom}
              </Show>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Show>
    </Dialog.Root>
  );
}
