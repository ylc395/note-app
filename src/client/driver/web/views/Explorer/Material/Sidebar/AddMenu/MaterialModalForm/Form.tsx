import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Form, Input, TextArea } from '@douyinfe/semi-ui';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default observer(function MaterialForm({ index }: { index: number }) {
  const { editingMaterials } = container.resolve(MaterialService);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const model = editingMaterials!.values[index]!;

  return (
    <Form>
      <Form.Label text="资料名" required />
      <Input value={model.name} onChange={action((value) => (model.name = value))} />
      <Form.ErrorMessage error={editingMaterials?.errors[index]?.name} />
      <Form.Label text="备注" />
      <TextArea value={model.comment} onChange={action((value) => (model.comment = value))} />
    </Form>
  );
});
