import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Resizable } from 're-resizable';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import Item from './Item';

export default observer(function MaterialSidebar() {
  const { materials, queryMaterials } = container.resolve(MaterialService);

  useEffect(() => {
    queryMaterials();
  }, []);

  return (
    <Resizable
      enable={{ right: true }}
      defaultSize={{ width: 200, height: '100vh' }}
      minWidth={200}
      className="border-r overflow-auto"
    >
      {materials.map((material) => (
        <Item key={material.id} material={material} />
      ))}
    </Resizable>
  );
});
