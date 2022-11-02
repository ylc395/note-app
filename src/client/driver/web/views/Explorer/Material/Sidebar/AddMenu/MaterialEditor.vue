<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue';
import type { UseConfirmDialogReturn } from '@vueuse/core';
import { NModal, NFormItem, NInput, NRate, NForm, NButton, NSpace, NTreeSelect } from 'naive-ui';
import { BIconTriangleFill } from 'bootstrap-icons-vue';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default defineComponent({
  components: {
    NModal,
    NFormItem,
    NInput,
    NRate,
    NForm,
    NButton,
    NSpace,
    NTreeSelect,
    BIconTriangleFill,
  },
  props: {
    dialog: {
      required: true,
      type: Object as PropType<UseConfirmDialogReturn<void, void, void>>,
    },
  },
  setup() {
    const {
      newMaterials,
      newFiles,
      uploadMaterials,
      tagTree: { roots },
    } = container.resolve(MaterialService);
    const showAll = ref(false);

    return { newMaterials, newFiles, showAll, uploadMaterials, roots };
  },
});
</script>
<template>
  <NModal to="#app" :show="dialog.isRevealed.value" preset="card" class="w-96" :closable="false" title="创建新资料">
    <NForm v-for="(material, index) in newMaterials" :key="index" label-width="auto" label-placement="left">
      <NFormItem label="源文件">
        <NInput readonly :value="newFiles[index].sourceUrl" />
      </NFormItem>
      <NFormItem label="资料名" required>
        <NInput v-model:value="material.name" placeholder="" />
      </NFormItem>
      <NFormItem label="标签">
        <NTreeSelect filterable checkable multiple :options="roots" key-field="id" label-field="name" />
      </NFormItem>
      <NButton v-if="!showAll" text block class="text-sm text-gray-400" @click="showAll = true">
        填写更多信息<BIconTriangleFill class="ml-1 rotate-180 text-xs" />
      </NButton>
      <div v-show="showAll">
        <NFormItem label="评分">
          <NRate v-model:value="material.rating" clearable />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="material.comment" type="textarea" placeholder="" />
        </NFormItem>
      </div>
      <NSpace justify="end" class="mt-6">
        <NButton type="primary" @click="uploadMaterials">确认</NButton>
        <NButton @click="dialog.cancel">取消</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>
