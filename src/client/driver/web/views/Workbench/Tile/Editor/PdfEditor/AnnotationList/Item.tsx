import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import dayjs from 'dayjs';

import { SelectorTypes, type AnnotationVO } from '@shared/domain/model/annotation';
import context from '../Context';
import assert from 'assert';
import PdfViewer from '../PdfViewer';
import PdfEditor from '@domain/app/model/material/editor/PdfEditor';

export default observer(function Item({ annotation }: { annotation: AnnotationVO }) {
  const {
    editor: { viewer },
  } = useContext(context);
  assert(viewer instanceof PdfViewer);

  const { selectors, body, updatedAt, createdAt } = annotation;
  const firstSelector = selectors[0];
  const lastSelector = selectors[selectors.length - 1];

  assert(firstSelector?.type === SelectorTypes.Fragment && lastSelector?.type === SelectorTypes.Fragment);
  const startPage = PdfEditor.parseFragment(firstSelector.value).page;
  const endPage = PdfEditor.parseFragment(lastSelector.value).page;

  return (
    <div className="border-0 border-b border-dashed border-gray-400 py-4">
      <div
        className="cursor-pointer border-0 border-l-2 border-solid pl-2 text-sm text-gray-400"
        style={{ borderColor: annotation.color }}
        onClick={() => viewer.jumpTo(startPage)}
      >
        <blockquote className="m-0">{annotation.targetText}</blockquote>
        <div className="mt-2 pr-2 text-right italic">
          {startPage === endPage ? `第${startPage}页` : `第${startPage}页-第${endPage}页`}
        </div>
      </div>
      <div className="mt-2 px-2">
        <div className="whitespace-pre">{body}</div>
        <div className="mt-2 text-right text-sm text-gray-400">
          {updatedAt === createdAt ? '创建于' : '更新于'}
          <time>{dayjs(updatedAt).format('YYYY-MM-DD HH:mm')}</time>
        </div>
      </div>
    </div>
  );
});
