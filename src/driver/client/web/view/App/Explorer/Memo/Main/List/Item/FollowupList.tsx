import { Key } from '@solid-primitives/keyed';
import { Tabs } from '@ark-ui/solid';
import { createMemo } from 'solid-js';

import { Tabs as MemoTabs } from '#domain/client/app/model/memo/Memo';

import Editor from '../../Editor';
import Item from './index';
import { useContext } from './context';

export default function FollowupList() {
  const memo = createMemo(() => useContext()!.memo);

  return (
    <Tabs.Content value={MemoTabs.Followup}>
      <Editor />
      <div>
        <Key each={memo().childrenQuery!.result.data} by="id">
          {(item) => <Item memo={item()} />}
        </Key>
      </div>
    </Tabs.Content>
  );
}
