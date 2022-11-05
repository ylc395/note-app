<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { container } from 'tsyringe';
import { NInput, NModal, NButton, NSpace, NFormItem, NForm } from 'naive-ui';
import type { UseConfirmDialogReturn } from '@vueuse/core';

import MaterialService from 'service/MaterialService';
import TagForm from 'model/form/TagForm';

export default defineComponent({
  components: { NInput, NModal, NButton, NFormItem, NSpace, NForm },
  props: {
    dialog: {
      required: true,
      type: Object as PropType<UseConfirmDialogReturn<void, void, void>>,
    },
  },
  setup(props) {
    const {
      tagTree: { createTag, selectedTag },
    } = container.resolve(MaterialService);

    const { errors, handleSubmit, values, reset } = new TagForm();
    const confirm = handleSubmit(async (values) => {
      await createTag(values);
      props.dialog.confirm();
    });

    props.dialog.onCancel(reset);

    return { errors, selectedTag, confirm, values };
  },
});
</script>
<template>
  <NModal to="#app" :show="dialog.isRevealed.value" preset="card" class="w-80" :closable="false" title="创建新标签">
    <NForm v-if="values" label-placement="left" label-width="auto">
      <NFormItem label="父级标签">
        <NInput readonly :value="selectedTag?.name || '无'" />
      </NFormItem>
      <NFormItem :feedback="errors.name" :validation-status="errors.name ? 'error' : undefined" label="标签名">
        <NInput v-model:value="values.name" class="mb-4" placeholder="" />
      </NFormItem>
    </NForm>
    <NSpace justify="end" class="mt-8">
      <NButton type="primary" @click="confirm">确认</NButton>
      <NButton @click="dialog.cancel">取消</NButton>
    </NSpace>
  </NModal>
</template>
