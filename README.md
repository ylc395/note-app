# 理念

## 区分四类数据

- 收集到的、未经自己整理的外界信息。称为**素材（material）**。例如一个网页摘抄、一个 PDF 电子书，等等
- 经本人系统整理、思考、总结后得出的知识。称为**笔记（note）**。每个笔记具有其专题性
- 需要定期复习的内容（通常比较简要以便于速览）。称为**卡片（card）**
- 不成体系的零散记录，称为**便签（memo）**
- 个人的任务/计划：称为**项目（project）**。每个项目类似 github 上的 project，有 issue 区，看板区等等

各类数据应明显地区分开（在 UI 和功能上）。

### 笔记

- 笔记由 [blocks](#块数据结构) 组成。笔记本身也是个 block
- 笔记编辑器（可切换）：无论哪个编辑器，其输出都以 blocks 和 raw markdown text 的形式进行保存
  - classic：左右分栏模式（[左：codemirror，右：只读的 milkdown](https://github.com/Saul-Mirone/milkdown/blob/2f6c538055a0b86eac6a28682697724d43c1a83c/website/component/Demo/Demo.tsx)）
  - IR markdown：类 typora 的及时渲染模式（milkdown）
- 组织结构展示：
  - 树形结构。一个笔记可存在于多个节点下（笔记的软连接），因此不需要标签了；每个节点本身也是一个笔记
  - hashtag 话题广场（参考 [obsidian](https://help.obsidian.md/How+to/Working+with+tags)），用于替换“unmentioned link”功能：对一个笔记，可以展示与其共享任一个话题的所有笔记
- 块引用及其预览 & 块嵌入
- lint 功能

### 素材

- UI：
  - 有个专门的“素材库”界面，用于管理、查看、编辑素材
  - 在编辑[笔记](#笔记)的时候，往笔记里添加的附件，也自动加到素材库里
- 素材类别：
  - 富文本/网页片段（=富文本 + 来源 url）：编辑，标注 + comment（浏览器双向同步）。编辑器默认只读，且功能有限（例如没有块嵌入，没有 lint 等）。在 UI 上体现“尽量不要编辑其内容”的观念
  - PDF/EPUB：标注 + comment
  - PPT
  - 本地视频：标注（时间 + comment）
  - 在线视频：标注（时间 + comment，浏览器双向同步）
  - 图片（本地或网络）：任意涂鸦、标注（浏览器双向同步）
  - 音频（本地或网络）：标注（时间 + comment，浏览器双向同步）
  - 代码文件（可参考各类 code snippet 管理软件）
  - collection（一个集合，可以包含任意个上述素材）
- 组织结构展示：标签视图（标签可树形嵌套。一个素材可以有多组标签） / 类别视图 / 来源视图 / 消费视图
- 其他：
  - comment / 标注 / 帧 / 音视频片段等内容都视为 block
  - 非文本素材，用户可以要求进行 OCR，以便于搜索

### 便签（todo）

### 计划（todo）

## 注重链接

必须有快速建立链接的能力，以体现知识间的联系。在形式上包括“超链接”和“动态嵌入”

- 超链接：
  - 主体：任意 -> block / 外部 URL
  - 鼠标上浮预览
  - 编辑器中键入[[]]可唤起快速链接面板（参考 obsidian 的做法）
  - 被链接的 block 有个角标提示其被链接数（见 joplin note link system）
  - 对任意笔记/素材，有一个 backlink / outlink 面板
  - 可展示一个 graph / 链接热度统计表等全局信息
- 动态嵌入（todo）：用某种声明式 DSL 动态生成内容

## 注重搜索

借助 SQLite 的能力进行全文搜索；支持各种搜索方式（见 obsidian 的做法）

## 注重版本控制

- 修订历史（记录每个操作），其中编辑操作的粒度到分钟。
- 连续的编辑记录可以合并

## 块数据结构

- 每个笔记由“块”组成。块是引用的粒度
- 可以“嵌套块”（渲染属于另一个笔记的块）
- 在每个块上展示其被引用的情况
- 素材/笔记等各类数据都可以充当块

## 编辑器

- 使用块式编辑器。在编辑器里，block 可用于增强编辑体验（参考飞书、思源）
- 简洁，无工具栏

# UI

- 模块化：用户可通过鼠标拖动，任意摆放 UI 部件
- 编辑器无工具栏

# 其他

## 导入

可以导入 .md 文件或目录

## 导出

- md 文件/目录
- github pages
