import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import type PdfViewer from '../PDFViewer';

import ResultList from './ResultList';
import Input from './Input';

export default function SearchBar(props: { pdfViewer: PdfViewer }) {
  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input searcher={props.pdfViewer.searcher} />
      <Show when={props.pdfViewer.searcher.matchesCount?.total === 0}>
        <div>没有结果</div>
      </Show>
      <Show when={Number(props.pdfViewer.searcher.matchesCount?.total) > 0}>
        <div>
          {props.pdfViewer.searcher.matchesCount?.current}/{props.pdfViewer.searcher.matchesCount?.total}
        </div>
      </Show>
      <div class="ml-6">
        <button
          disabled={!props.pdfViewer.searcher.matchesCount?.total}
          onClick={() => props.pdfViewer.searcher.previous()}
        >
          <ArrowUpIcon />
        </button>
        <button
          disabled={!props.pdfViewer.searcher.matchesCount?.total}
          onClick={() => props.pdfViewer.searcher.next()}
        >
          <ArrowDownIcon />
        </button>
        <Popover.Root lazyMount unmountOnExit>
          <Popover.Trigger disabled={!props.pdfViewer.editor.textFinder.searchResult}>
            <ListIcon />
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <ResultList pdfViewer={props.pdfViewer} />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </div>
    </div>
  );
}
