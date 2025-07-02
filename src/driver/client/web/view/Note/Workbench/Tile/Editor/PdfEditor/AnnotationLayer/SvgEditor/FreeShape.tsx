import { getStroke } from 'perfect-freehand';
import { createEventListener } from '@solid-primitives/event-listener';
import { createMemo, createSignal, Show, type JSX } from 'solid-js';

export default function FreeShape(props: {
  pageElement: HTMLElement;
  pageScale: { width: number; height: number };
  color: string;
  thickness: number;
  onCreate: (e: JSX.PathSVGAttributes<SVGPathElement>) => void;
}) {
  const [getPoints, setPoints] = createSignal<[number, number, number][]>();

  createEventListener(
    () => props.pageElement,
    'pointerdown',
    (e) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setPoints([[...getMousePosition(e), e.pressure]]);
    },
  );

  createEventListener(
    () => props.pageElement,
    'pointermove',
    (e) => {
      if (e.buttons === 1) {
        setPoints([...(getPoints() || []), [...getMousePosition(e), e.pressure]]);
      }
    },
  );

  createEventListener(
    () => props.pageElement,
    'pointerup',
    () => {
      const value = svgProps();

      if (value) {
        props.onCreate(value);
      }

      setPoints(undefined);
    },
  );

  const pathData = createMemo(() => {
    const points = getPoints();

    if (!points) {
      return null;
    }

    return getSvgPathFromStroke(getStroke(points, { size: props.thickness }));
  });

  const svgProps = createMemo(() => {
    const d = pathData();

    if (!d) {
      return null;
    }

    return {
      d,
      fill: props.color,
    } satisfies JSX.PathSVGAttributes<SVGPathElement>;
  });

  function getMousePosition(e: { clientX: number; clientY: number }) {
    const rect = props.pageElement.getBoundingClientRect();
    const x = (e.clientX - rect.left - props.pageElement.clientLeft) / props.pageScale.width;
    const y = (e.clientY - rect.top - props.pageElement.clientTop) / props.pageScale.height;

    return [x, y] as const;
  }

  function getSvgPathFromStroke(stroke: number[][]) {
    const first = stroke[0];

    if (!first) {
      return '';
    }

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length]!;
        acc.push(x0!, y0!, (x0! + x1!) / 2, (y0! + y1!) / 2);
        return acc;
      },
      ['M', ...first, 'Q'],
    );

    d.push('Z');
    return d.join(' ');
  }

  return <Show when={svgProps()}>{(props) => <path {...props()}></path>}</Show>;
}
