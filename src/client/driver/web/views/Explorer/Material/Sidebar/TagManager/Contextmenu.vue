<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import Contextmenu from 'web/components/Contextmenu.vue';
import type useContextmenu from 'web/components/useContextmenu';

export default defineComponent({
  components: { Contextmenu },
  props: {
    token: { required: true, type: Symbol as PropType<ReturnType<typeof useContextmenu>['token']> },
  },
});
</script>
<template>
  <Contextmenu
    :token="token"
    :options="[
      { label: '新建子标签', key: 'create' },
      { label: '删除', key: 'delete' },
      { label: '重命名', key: 'rename' },
    ]"
  />
</template>
