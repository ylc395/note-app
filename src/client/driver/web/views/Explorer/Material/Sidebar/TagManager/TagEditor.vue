<script lang="ts">
import { defineComponent, reactive, type PropType } from 'vue';
import { container } from 'tsyringe';
import { NInput, NModal } from 'naive-ui';
import type { UseConfirmDialogReturn } from '@vueuse/core';

import MaterialService from 'service/MaterialService';
import { TagDTO, TagTypes } from 'interface/Tag';

export default defineComponent({
  components: { NInput, NModal },
  props: {
    dialog: {
      required: true,
      type: Object as PropType<UseConfirmDialogReturn<void, TagDTO, void>>,
    },
  },
  setup(props) {
    const {
      tagTree: { createTag, selectedNodeId },
    } = container.resolve(MaterialService);

    props.dialog.onConfirm(createTag);

    const newTag = reactive<TagDTO>({
      parentId: selectedNodeId.value,
      type: TagTypes.Material,
      name: '',
    });

    return { newTag };
  },
});
</script>
<template>
  <NModal to="#app" :show="dialog.isRevealed.value" preset="card" class="w-80" :closable="false">
    <NInput v-model:value="newTag.name" />
    <div>
      <button @click="dialog.confirm(newTag)">确认</button>
      <button @click="dialog.cancel">取消</button>
    </div>
  </NModal>
</template>
