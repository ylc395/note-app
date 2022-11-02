<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useMouseInElement, useConfirmDialog } from '@vueuse/core';
import { container } from 'tsyringe';
import { NTree, NCollapseItem, NButton } from 'naive-ui';
import { BIconPlus } from 'bootstrap-icons-vue';

import MaterialService from 'service/MaterialService';
import TagEditor from './TagEditor.vue';

export default defineComponent({
  components: { NTree, NCollapseItem, NButton, BIconPlus, TagEditor },
  setup() {
    const {
      tagTree: { roots, selectTag },
    } = container.resolve(MaterialService);

    const rootRef = ref();
    const { isOutside } = useMouseInElement(rootRef);
    const dialog = useConfirmDialog();

    return { roots, selectTag, isOutside, rootRef, dialog };
  },
});
</script>
<template>
  <NCollapseItem ref="rootRef" title="标签管理器">
    <template #header-extra="{ collapsed }">
      <div v-if="!collapsed && !isOutside" @click.stop>
        <NButton text @click="dialog.reveal"><BIconPlus /></NButton>
      </div>
    </template>
    <NTree
      block-line
      :data="roots"
      key-field="id"
      label-field="name"
      @update:selected-keys="(keys) => selectTag(keys[0])"
    />
    <TagEditor :dialog="dialog" />
  </NCollapseItem>
</template>
