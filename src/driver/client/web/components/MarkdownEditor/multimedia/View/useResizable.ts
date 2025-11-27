import { isEqual } from 'lodash-es';
import { createEffect, createSignal, onCleanup, type Accessor, type JSX } from 'solid-js';

interface Size {
  width: number;
  height: number;
}

type Handle = 'se' | 'sw' | 'ne' | 'nw';

export default function useResizable({
  initialSize,
  onResized,
}: {
  initialSize: Accessor<Partial<Size> | undefined>;
  onResized: (size: Size) => void;
}) {
  const [size, setSize] = createSignal<Size>();
  const [isResizing, setIsResizing] = createSignal(false);
  const [mediaRef, setMediaRef] = createSignal<HTMLElement>();
  const [naturalSize, setNaturalSize] = createSignal<Size>();

  let currentHandle: Handle | null = null;
  let startSize:
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | undefined;

  const minWidth = 10;
  const minHeight = 10;

  createEffect(() => {
    const mediaEl = mediaRef();

    if (!mediaEl) {
      return;
    }

    if (mediaEl instanceof HTMLImageElement || mediaEl instanceof HTMLVideoElement) {
      if (mediaEl instanceof HTMLImageElement && mediaEl.naturalWidth > 0) {
        setNaturalSize({ width: mediaEl.naturalWidth, height: mediaEl.naturalHeight });
        return;
      }

      if (mediaEl instanceof HTMLVideoElement && mediaEl.readyState >= 1) {
        setNaturalSize({ width: mediaEl.videoWidth, height: mediaEl.videoHeight });
        return;
      }

      const handleLoad = (e: Event) => {
        if (e.target instanceof HTMLImageElement) {
          setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
        }

        if (e.target instanceof HTMLVideoElement) {
          setNaturalSize({ width: e.target.videoWidth, height: e.target.videoHeight });
        }
      };

      mediaEl.addEventListener('loadedmetadata', handleLoad);

      onCleanup(() => {
        mediaEl.removeEventListener('loadedmetadata', handleLoad);
      });

      // electron 里图片的 loadedmetadata 事件似乎无效（可能和伪协议的实现有关），因此再监听 load 形成双保险
      if (mediaEl instanceof HTMLImageElement) {
        mediaEl.addEventListener('load', handleLoad);

        onCleanup(() => {
          mediaEl.removeEventListener('load', handleLoad);
        });
      }
    }
  });

  const handleMouseDown = (e: MouseEvent, handle: Handle) => {
    const sizeValue = size() || naturalSize();
    if (!sizeValue) return;

    const { width, height } = sizeValue;

    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    currentHandle = handle;
    startSize = {
      x: e.clientX,
      y: e.clientY,
      width: width,
      height: height,
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const naturalSizeValue = naturalSize();
    if (!isResizing() || !startSize || !naturalSizeValue) return;

    const deltaX = e.clientX - startSize.x;
    const deltaY = e.clientY - startSize.y;

    let newWidth;
    let newHeight;

    switch (currentHandle) {
      case 'se':
        newWidth = Math.max(minWidth, startSize.width + deltaX);
        newHeight = Math.max(minHeight, startSize.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(minWidth, startSize.width - deltaX);
        newHeight = Math.max(minHeight, startSize.height + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(minWidth, startSize.width + deltaX);
        newHeight = Math.max(minHeight, startSize.height - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(minWidth, startSize.width - deltaX);
        newHeight = Math.max(minHeight, startSize.height - deltaY);
        break;
      default:
        throw new Error();
    }

    if (naturalSizeValue.height > 0) {
      const ratio = naturalSizeValue.width / naturalSizeValue.height;
      if (newWidth / newHeight > ratio) {
        newHeight = newWidth / ratio;
      } else {
        newWidth = newHeight * ratio;
      }
    }

    setSize({
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMouseUp = () => {
    currentHandle = null;
    setIsResizing(false);

    const sizeValue = size();

    if (sizeValue) {
      onResized(sizeValue);
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  const containerStyle = () => {
    const style: JSX.CSSProperties = {
      'user-select': isResizing() ? 'none' : 'auto',
    };

    const sizeValue = size();
    const initialSizeValue = initialSize();

    return {
      ...style,
      ...(sizeValue && !isEqual(sizeValue, naturalSize())
        ? {
            width: `${sizeValue.width}px`,
            height: `${sizeValue.height}px`,
          }
        : {
            width: initialSizeValue?.width ? `${initialSizeValue.width}px` : 'fit-content',
            ...(initialSizeValue?.height ? { height: `${initialSizeValue.height}px` } : null),
          }),
    };
  };

  return {
    naturalSize,
    setMediaRef,
    containerStyle,
    handleMouseDown,
  };
}
