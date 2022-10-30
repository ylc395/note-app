<script lang="ts">
import { defineComponent, type PropType, reactive } from 'vue';
import { container } from 'tsyringe';
import { NInput } from 'naive-ui';

import TagService from 'service/TagService';
import { TagDTO, TagTypes } from 'interface/Tag';

export default defineComponent({
  components: { NInput },
  props: {
    confirm: { required: true, type: Function as PropType<(tag: TagDTO) => void> },
    cancel: { required: true, type: Function as PropType<() => void> },
  },
  setup() {
    const { materialTagTree } = container.resolve(TagService);
    const newTag = reactive<TagDTO>({
      parentId: materialTagTree.selectedNodeId.value,
      type: TagTypes.Material,
      name: '',
    });

    return { newTag };
  },
});
</script>
<template>
  <div>
    <NInput v-model:value="newTag.name" />
    <div>
      <button @click="confirm(newTag)">确认</button>
      <button @click="cancel">取消</button>
    </div>
  </div>
</template>
