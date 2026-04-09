import { TileSplitDirections } from '#domain/client/app/model/Workbench';

export default function DropIndicator(props: { tileDirection: TileSplitDirections | 'middle' }) {
  return (
    <div
      class="absolute bg-bg-info opacity-30 flex justify-center items-center z-10"
      classList={{
        'left-0': props.tileDirection !== TileSplitDirections.Right,
        'right-0': props.tileDirection !== TileSplitDirections.Left,
        'bottom-0': props.tileDirection !== TileSplitDirections.Top,
        'top-0': props.tileDirection !== TileSplitDirections.Bottom,
        'right-[80%]': props.tileDirection === TileSplitDirections.Left,
        'left-[80%]': props.tileDirection === TileSplitDirections.Right,
        'top-[80%]': props.tileDirection === TileSplitDirections.Bottom,
        'bottom-[80%]': props.tileDirection === TileSplitDirections.Top,
      }}
    >
      放置以打开
    </div>
  );
}
