import { memo } from 'react';
import { GrDocumentPdf, GrDocumentImage, GrDocument } from 'react-icons/gr';

import type { MaterialVO } from 'interface/Material';

// eslint-disable-next-line mobx/missing-observer
export default memo(function Icon({ material }: { material: MaterialVO }) {
  if (material.file) {
    if (material.file.mimeType.startsWith('image/')) {
      return <GrDocumentImage />;
    }

    if (material.file.mimeType.endsWith('/pdf')) {
      return <GrDocumentPdf />;
    }
  }

  return <GrDocument />;
});
