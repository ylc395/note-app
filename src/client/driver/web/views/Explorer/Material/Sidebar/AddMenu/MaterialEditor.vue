<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { UseConfirmDialogReturn } from '@vueuse/core';
import { NModal, NFormItem, NInput } from 'naive-ui';

export default defineComponent({
  components: {
    NModal,
    NFormItem,
    NInput,
  },
  props: {
    dialog: {
      required: true,
      type: Object as PropType<UseConfirmDialogReturn<void, void, void>>,
    },
  },
});
</script>
<template>
  <NModal to="#app" :show="dialog.isRevealed.value" preset="card" class="w-80" :closable="false" title="创建新资料">
    <NFormItem label="资料名">
      <NInput />
    </NFormItem>
  </NModal>
</template>
