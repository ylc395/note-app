<script lang="ts">
import { defineComponent } from 'vue';
import { container } from 'tsyringe';
import { NInput, NModal, NButton, NSpace, NFormItem, NForm } from 'naive-ui';

import MaterialService from 'service/MaterialService';

export default defineComponent({
  components: { NInput, NModal, NButton, NFormItem, NSpace, NForm },
  setup() {
    const {
      tagTree: { selectedTag, editingTag, stopCreatingTag },
    } = container.resolve(MaterialService);

    return { editingTag, selectedTag, stopCreatingTag };
  },
});
</script>
<template>
  <NModal to="#app" :show="Boolean(editingTag)" preset="card" class="w-80" :closable="false" title="创建新标签">
    <NForm v-if="editingTag" label-placement="left" label-width="auto">
      <NFormItem label="父级标签">
        <NInput readonly :value="selectedTag?.name || '无'" />
      </NFormItem>
      <NFormItem
        :feedback="editingTag.errors.value.name"
        :validation-status="editingTag.errors.value.name ? 'error' : undefined"
        label="标签名"
      >
        <NInput v-model:value="editingTag.values.value.name" class="mb-4" placeholder="" />
      </NFormItem>
    </NForm>
    <NSpace justify="end" class="mt-8">
      <NButton type="primary" @click="editingTag?.submit">确认</NButton>
      <NButton @click="stopCreatingTag">取消</NButton>
    </NSpace>
  </NModal>
</template>
