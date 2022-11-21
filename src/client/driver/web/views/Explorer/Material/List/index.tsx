import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import { Resizable } from 're-resizable';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import WorkbenchService from 'service/WorkbenchService';
import type { MaterialVO } from 'interface/Material';

export default observer(function MaterialSidebar() {
  const { materials, queryMaterials } = container.resolve(MaterialService);
  const { open } = container.resolve(WorkbenchService);

  useEffect(() => {
    queryMaterials();
  }, []);

  const handleClick = useCallback((material: MaterialVO) => {
    return () => {
      open(material);
    };
  }, []);

  return (
    <Resizable
      enable={{ right: true }}
      defaultSize={{ width: 200, height: 'auto' }}
      minWidth={200}
      className="border-r overflow-auto"
    >
      {materials.map((material) => (
        <div key={material.id} onClick={handleClick(material)}>
          {material.name}
        </div>
      ))}
    </Resizable>
  );
});
