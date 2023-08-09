import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';

import type { AnnotationVO } from 'model/material';
import ctx from '../Context';
import { useContext } from 'react';

export default observer(function Annotation({ annotation }: { annotation: AnnotationVO }) {
  const { htmlViewer } = useContext(ctx);
  const { comment, createdAt, updatedAt } = annotation;

  return (
    <div className="border-0 border-b border-dashed border-gray-400 py-4">
      <div
        className="cursor-pointer border-0 border-l-2 border-solid pl-2 text-sm text-gray-400"
        style={{ borderColor: annotation.color }}
        onClick={() => htmlViewer?.jumpToAnnotation(annotation)}
      ></div>
      <div className="mt-2 px-2">
        <div className="whitespace-pre">{comment}</div>
        <div className="mt-2 text-right text-sm text-gray-400">
          {updatedAt === createdAt ? '创建于' : '更新于'}
          <time>{dayjs.unix(updatedAt).format('YYYY-MM-DD HH:mm')}</time>
        </div>
      </div>
    </div>
  );
});
