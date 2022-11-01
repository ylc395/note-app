<script lang="ts">
import { defineComponent, type PropType, ref, watch } from 'vue';
import { container } from 'tsyringe';
import { NInput, NModal, NButton, NSpace, NFormItem } from 'naive-ui';
import { type UseConfirmDialogReturn, toReactive } from '@vueuse/core';
import isError from 'lodash/isError';

import MaterialService from 'service/MaterialService';
import type { EditingTag } from 'model/TagTree';
import { refResetOn } from 'web/utils/composables';

export default defineComponent({
  components: { NInput, NModal, NButton, NFormItem, NSpace },
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
    <p>父标签：{{ selectedTag?.name || '无' }}</p>
    <NFormItem :feedback="feedback" :validation-status="validateStatus">
      <NInput v-model:value="newTag.name" class="mb-4" placeholder="输入标签名" />
    </NFormItem>
    <NSpace justify="end">
      <NButton type="primary" :disabled="newTag.name.length === 0" @click="confirm">确认</NButton>
      <NButton @click="dialog.cancel">取消</NButton>
    </NSpace>
  </NModal>
</template>
