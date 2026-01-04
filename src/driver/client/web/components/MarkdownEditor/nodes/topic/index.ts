import { editTopicCommand } from './commands';
import { topicNode, topicRemark } from './node';
import './style.css';

export default [topicNode, topicRemark, editTopicCommand].flat();
