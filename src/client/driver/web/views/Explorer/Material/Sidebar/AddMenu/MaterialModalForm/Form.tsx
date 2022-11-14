import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Form, Input, TextArea } from '@douyinfe/semi-ui';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { useCallback } from 'react';

export default observer(function MaterialForm({ index }: { index: number }) {
  const { editingMaterials } = container.resolve(MaterialService);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const model = editingMaterials!.values[index]!;
  const handleCommentChange = useCallback(
    action((value: string) => (model.comment = value)),
    [model],
  );
  const handleNameChange = useCallback(
    action((value: string) => (model.name = value)),
    [model],
  );

  return (
    <Form>
      <Form.Label text="资料名" required />
      <Input value={model.name} onChange={handleNameChange} />
      <Form.ErrorMessage error={editingMaterials?.errors[index]?.name} />
      <Form.Label text="备注" />
      <TextArea value={model.comment} onChange={handleCommentChange} />
    </Form>
  );
});
