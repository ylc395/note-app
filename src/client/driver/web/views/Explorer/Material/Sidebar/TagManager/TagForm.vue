<script lang="ts">
import { defineComponent, type PropType, ref, watch } from 'vue';
import { container } from 'tsyringe';
import { NInput, NModal, NButton, NSpace, NFormItem, NForm } from 'naive-ui';
import { type UseConfirmDialogReturn, toReactive } from '@vueuse/core';
import isError from 'lodash/isError';

import MaterialService from 'service/MaterialService';
import type { EditingTag } from 'model/TagTree';
import { refResetOn } from 'web/utils/composables';

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

    const getNewTag = () => ({ name: '' });
    const newTag = toReactive(refResetOn<EditingTag>(getNewTag, props.dialog.onReveal));
    const feedback = ref();
    const validateStatus = ref();
    const confirm = async () => {
      try {
        await createTag(newTag);
        props.dialog.confirm();
      } catch (e) {
        feedback.value = isError(e) ? e.message : String(e);
        validateStatus.value = 'error';
      }
    };

    watch(
      () => newTag.name,
      () => {
        feedback.value = undefined;
        validateStatus.value = undefined;
      },
    );

    return { newTag, feedback, confirm, validateStatus, selectedTag };
  },
});
</script>
<template>
  <NModal to="#app" :show="dialog.isRevealed.value" preset="card" class="w-80" :closable="false" title="创建新标签">
    <NForm label-placement="left" label-width="auto">
      <NFormItem label="父级标签">
        <NInput readonly :value="selectedTag?.name || '无'" />
      </NFormItem>
      <NFormItem :feedback="feedback" :validation-status="validateStatus" label="标签名">
        <NInput v-model:value="newTag.name" class="mb-4" placeholder="" />
      </NFormItem>
    </NForm>
    <NSpace justify="end">
      <NButton type="primary" :disabled="newTag.name.length === 0" @click="confirm">确认</NButton>
      <NButton @click="dialog.cancel">取消</NButton>
    </NSpace>
  </NModal>
</template>
