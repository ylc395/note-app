import { Select, createListCollection } from '@ark-ui/solid';
import { Index } from 'solid-js';
import { ChevronDownIcon } from 'lucide-solid';
import { Shape } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import { useContext } from '../../context';

export default function ShapeSelector() {
  const {
    viewer: { editor },
  } = useContext()!;

  const collection = createListCollection({
    items: [
      { label: '矩形', value: Shape.Rect },
      { label: '圆形', value: Shape.Circle },
      { label: '任意多边形', value: Shape.Polygon },
      { label: '自由绘制', value: Shape.Free },
    ],
  });

  return (
    <Select.Root
      lazyMount
      unmountOnExit
      collection={collection}
      value={[editor.svgEditor.shape]}
      onValueChange={(e) => (editor.svgEditor.shape = e.value[0] as Shape)}
    >
      <Select.Control>
        <Select.Trigger class="flex items-center">
          <Select.ValueText class="w-20 text-start" />
          <Select.Indicator>
            <ChevronDownIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner class="bg-white">
        <Select.Content class="z-10">
          <Select.ItemGroup>
            <Index each={collection.items}>
              {(item) => (
                <Select.Item class="flex cursor-pointer w-32" item={item()}>
                  {item().label}
                </Select.Item>
              )}
            </Index>
          </Select.ItemGroup>
        </Select.Content>
      </Select.Positioner>
      <Select.HiddenSelect />
    </Select.Root>
  );
}
