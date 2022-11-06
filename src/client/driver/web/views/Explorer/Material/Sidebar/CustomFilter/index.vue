<script lang="ts">
import { defineComponent } from 'vue';
import { NCollapseItem } from 'naive-ui';

export default defineComponent({
  name: 'CustomFilter',
  components: { NCollapseItem },
});
</script>
<template>
  <NCollapseItem title="固定视图">
    <div>全部资料</div>
    <div>今日入库</div>
    <div>最常浏览</div>
  </NCollapseItem>
</template>
