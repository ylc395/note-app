import MessageService from '../service/MessageService';
import { Actions } from 'interface/payload';

export default function Menu() {
  return (
    <div>
      <ul className="list-none">
        <li>
          <button onClick={() => MessageService.invoke(Actions.SelectElement)}>手动选取页面元素</button>
        </li>
        <li>
          <button onClick={() => MessageService.invoke(Actions.SelectPage)}>选取整个页面</button>
        </li>
        <li>
          <button onClick={() => MessageService.invoke(Actions.ExtractText)}>抽取页面正文</button>
        </li>
        <li>
          <button onClick={() => MessageService.invoke(Actions.ExtractSelection)}>抽取页面选中部分</button>
        </li>
        <li>
          <button onClick={() => MessageService.invoke(Actions.ScreenShot)}>截图</button>
        </li>
      </ul>
    </div>
  );
}
