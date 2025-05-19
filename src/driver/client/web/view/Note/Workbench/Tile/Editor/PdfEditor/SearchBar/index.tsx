import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { onCleanup, Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import type PdfViewer from '../PDFViewer';

import ResultList from './ResultList';
import Input from './Input';
import Searcher from './Searcher';

export default function SearchBar(props: { pdfViewer: PdfViewer }) {
  const searcher = new Searcher(props.pdfViewer);
  onCleanup(() => searcher.destroy());

  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input searcher={searcher} />
      <Show when={searcher.matchesCount && !searcher.matchesCount.total}>
        <div>没有结果</div>
      </Show>
      <Show when={Number(searcher.matchesCount?.total) > 0}>
        <div>
          {searcher.matchesCount?.current}/{searcher.matchesCount?.total}
        </div>
      </Show>
      <div class="ml-6">
        <button disabled={!searcher.matchesCount?.total} onClick={() => searcher.previous()}>
          <ArrowUpIcon />
        </button>
        <button disabled={!searcher.matchesCount?.total} onClick={() => searcher.next()}>
          <ArrowDownIcon />
        </button>
        <Popover.Root>
          <Popover.Trigger disabled={!searcher.searchResult}>
            <ListIcon />
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <ResultList searchResult={searcher.searchResult!} />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </div>
    </div>
  );
}
