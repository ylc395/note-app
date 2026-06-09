import { Dialog, type DialogOpenChangeDetails } from '@ark-ui/solid/dialog';
import { type JSXElement, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { XIcon } from 'lucide-solid';
import shell from '#web/infra/shell';
import Button from './Button';

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
  cancelText?: string | null;
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
      closeOnInteractOutside={props.closeOnInteractOutside ?? false}
      open={props.open}
      onOpenChange={handleOpenChange}
    >
      <Show when={props.open}>
        <Portal mount={shell.appRoot}>
          <Dialog.Backdrop class="fixed inset-0 bg-bg-overlay z-10" />
          <Dialog.Positioner class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Dialog.Content class="bg-surface-overlay p-6 rounded-lg w-md">
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
                    <Show when={props.cancelText !== null}>
                      <Button size="lg" onClick={props.onCancel}>
                        {props.cancelText ?? '取 消'}
                      </Button>
                    </Show>
                    <Button
                      size="lg"
                      intent="primary"
                      disabled={props.canConfirm}
                      onClick={props.onConfirm || props.onClose}
                    >
                      {props.confirmText ?? '确 认'}
                    </Button>
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
