<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue';
import { container } from 'tsyringe';
import { NModal, NButton, NSpace, NCheckbox } from 'naive-ui';
import type { UseConfirmDialogReturn } from '@vueuse/core';

import MaterialService from 'service/MaterialService';

export default defineComponent({
  components: { NModal, NButton, NSpace, NCheckbox },
  props: {
    dialog: {
      required: true,
      type: Object as PropType<UseConfirmDialogReturn<void, void, void>>,
    },
  },
  setup(props) {
    const {
      tagTree: { deleteTag, selectedTag },
    } = container.resolve(MaterialService);

    const needDeleteChildren = ref(true);

    const confirm = async () => {
      if (!selectedTag.value) {
        throw new Error('no selectedTag');
      }
      await deleteTag(selectedTag.value.id, needDeleteChildren.value);
      props.dialog.confirm();
    };

    return { selectedTag, confirm, needDeleteChildren };
  },
});
</script>
<template>
  <NModal to="#app" :show="dialog.isRevealed.value" preset="card" class="w-80" :closable="false">
    确认删除标签 {{ selectedTag!.name }} 吗？
    <NCheckbox
      v-if="selectedTag!.children"
      v-model:checked="needDeleteChildren"
      size="small"
      label="同时删除其全部子标签"
    />
    <NSpace justify="end" class="mt-8">
      <NButton type="warning" @click="confirm">确认</NButton>
      <NButton @click="dialog.cancel">取消</NButton>
    </NSpace>
  </NModal>
</template>
