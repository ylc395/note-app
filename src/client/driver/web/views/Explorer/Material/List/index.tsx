import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Resizable } from 're-resizable';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default observer(function MaterialSidebar() {
  const { materials, queryMaterials } = container.resolve(MaterialService);

  useEffect(() => {
    queryMaterials();
  }, []);

  return (
    <Resizable enable={{ right: true }} className="border-r overflow-auto">
      {materials.map(({ name, id }) => (
        <div key={id}>{name}</div>
      ))}
    </Resizable>
  );
});
