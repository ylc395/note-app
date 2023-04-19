## Start

`yarn && yarn dev:electron`

## 同步算法

### SyncMeta

```ts
interface SyncMeta {
  machineName: string;
  appName: string;
  id?: string; // 若缺失，说明该次同步尚未完成
}
```

### 算法

前提：每个客户端都记录自己经历过的同步过程。每当用户改变了同步配置，则同步过程的记录应当被删除

0. 若发现本机正在同步，则返回
1. 拉取远程仓库元信息（SyncMeta）。若发现远程存在正在发生的同步，则中止本次同步
2. 开始尝试拉取：
   1. syncMeta.id 已经经历过，则跳过拉取环节
   2. 拉取远程仓库所有内容，逐一与本地比对变动。一致则跳过，否则：
      - 本地内容的变动发生时间晚于 remoteItem.updatedAt，且 remoteItem.syncId 是未经历过的：给用户报告冲突。在用户解决冲突之前，不再继续
      - 否则： 根据远程内容，删除/覆盖/新建相应的本地内容
3. 开始尝试推送：查找本地的、变动发生时间晚于对应的 remoteItem.updatedAt 的内容
