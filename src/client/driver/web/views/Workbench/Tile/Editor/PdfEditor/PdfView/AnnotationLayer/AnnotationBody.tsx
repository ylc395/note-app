import type { AnnotationVO } from '@shared/domain/model/annotation';
import { observer } from 'mobx-react-lite';

export default observer(function AnnotationBody({ annotation }: { annotation: AnnotationVO }) {
  return (
    <div className="bg-white p-2" style={{ backgroundColor: annotation.color }}>
      <div>{annotation.body}</div>
    </div>
  );
});
