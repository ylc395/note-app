import { singleton } from 'tsyringe';
import { ref } from '@vue/reactivity';

type Length = number | 'auto';

interface LayoutBox {
  id: ComponentNames;
  height: Length;
}

interface LayoutColumn {
  width: Length;
  rows: LayoutBox[];
}

export enum ComponentNames {
  KnowledgeSwitcher = 'knowledgeSwitcher',
  ItemList = 'itemList',
  Tabs = 'tabs',
  Workbench = 'workbench',
}

export enum KnowledgeTypes {
  Materials = 'materials',
  Notes = 'notes',
  Memos = 'memos',
  Projects = 'projects',
  Cards = 'cards',
}

@singleton()
export default class Layout {
  readonly columns = ref<LayoutColumn[]>([
    {
      width: 100,
      rows: [{ id: ComponentNames.KnowledgeSwitcher, height: 'auto' }],
    },
    { width: 200, rows: [{ id: ComponentNames.ItemList, height: 'auto' }] },
    {
      width: 'auto',
      rows: [
        { id: ComponentNames.Tabs, height: 40 },
        { id: ComponentNames.Workbench, height: 'auto' },
      ],
    },
  ]);

  readonly viewType = ref<KnowledgeTypes>(KnowledgeTypes.Notes);
}
