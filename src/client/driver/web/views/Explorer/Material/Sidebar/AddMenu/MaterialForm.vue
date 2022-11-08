<script lang="ts">
import { defineComponent, ref } from 'vue';
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
  setup() {
    const {
      tagTree: { roots },
      files,
      editingMaterials,
      clearFiles,
    } = container.resolve(MaterialService);
    const showAll = ref(files.value.map(() => false));

    return { editingMaterials, files, showAll, roots, clearFiles };
  },
});
</script>
<template>
  <NModal :show="Boolean(editingMaterials)" to="#app" preset="card" class="w-1/3" :closable="false" title="创建新资料">
    <template v-if="editingMaterials">
      <NForm
        v-for="(material, index) in editingMaterials.values.value"
        :key="index"
        label-width="auto"
        label-placement="left"
      >
        <NFormItem
          label="源文件"
          :feedback="files[index].isDuplicated ? '该文件此前已存在于资料库中，继续上传将创建一个副本' : ''"
          :validation-status="files[index].isDuplicated ? 'warning' : undefined"
        >
          <NInput readonly :value="files[index].sourceUrl" />
        </NFormItem>
        <NFormItem
          label="资料名"
          required
          :feedback="editingMaterials.errors.value[index]?.name"
          :validation-status="editingMaterials.errors.value[index]?.name ? 'error' : undefined"
        >
          <NInput v-model:value="material.name" placeholder="" />
        </NFormItem>
        <NFormItem label="标签">
          <NTreeSelect
            v-model:value="material.tags"
            filterable
            checkable
            multiple
            :options="roots"
            key-field="id"
            label-field="name"
          />
        </NFormItem>
        <NButton v-if="!showAll[index]" text block class="text-sm text-gray-400" @click="showAll[index] = true">
          填写更多信息<BIconTriangleFill class="ml-1 rotate-180 text-xs" />
        </NButton>
        <div v-show="showAll[index]">
          <NFormItem label="评分">
            <NRate v-model:value="material.rating" clearable />
          </NFormItem>
          <NFormItem label="备注">
            <NInput v-model:value="material.comment" type="textarea" placeholder="" />
          </NFormItem>
        </div>
      </NForm>
    </template>
    <NSpace justify="end" class="mt-6">
      <NButton type="primary" @click="editingMaterials?.submit">确认</NButton>
      <NButton @click="clearFiles">取消</NButton>
    </NSpace>
  </NModal>
</template>
