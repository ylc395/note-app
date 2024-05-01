import { useContext, useState } from 'react';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';
import { useAsyncEffect } from 'ahooks';

interface Props {
  rect: { left: number; top: number; width: number; height: number };
  page: number;
}

// eslint-disable-next-line mobx/missing-observer
export default (function Viewrect({ rect, page }: Props) {
  const {
    editor: { viewer },
  } = useContext(context);
  assert(viewer instanceof PdfViewer);

  const [dataUrl, setDataUrl] = useState('');

  useAsyncEffect(async () => {
    setDataUrl(await viewer.getViewrectDataUrl(page, rect));
  }, [page, rect, viewer]);

  return <img src={dataUrl} />;
});
