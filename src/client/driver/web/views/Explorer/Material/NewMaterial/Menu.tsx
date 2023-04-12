import { observer } from 'mobx-react-lite';

export default observer(function NewMaterial() {
  return (
    <ul>
      <li>本机文件</li>
      <li>URL 下载</li>
      <li>手动编辑文本</li>
    </ul>
  );
});
