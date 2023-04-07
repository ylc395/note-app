import type { MaterialVO, DirectoryVO } from 'interface/material';

export interface MaterialRepository {
  create: (
    material: Partial<{
      name: string;
      mimeType: string;
      sourceUrl: string;
      parentId: DirectoryVO['id'];
      icon: string;
      content: string | ArrayBuffer;
    }>,
  ) => Promise<MaterialVO>;
}
