<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useMouseInElement, useConfirmDialog } from '@vueuse/core';
import { container } from 'tsyringe';
import { NTree, NCollapseItem, NButton, NModal } from 'naive-ui';
import { BIconPlus } from 'bootstrap-icons-vue';

import MaterialService from 'service/MaterialService';
import TagEditor from './TagEditor.vue';

export default defineComponent({
  components: { NTree, NCollapseItem, NButton, NModal, BIconPlus, TagEditor },
  setup() {
    const {
      tagTree: { roots, selectNode, createTag },
    } = container.resolve(MaterialService);
    const rootRef = ref();
    const { isOutside } = useMouseInElement(rootRef);
    const { isRevealed, reveal, onConfirm, confirm, cancel } = useConfirmDialog();

    onConfirm(createTag);

    return { createTag, roots, selectNode, isOutside, rootRef, isRevealed, reveal, confirm, cancel };
  },
});
</script>
<template>
  <NCollapseItem ref="rootRef" title="标签管理器">
    <template #header-extra="{ collapsed }">
      <div v-if="!collapsed && !isOutside" @click.stop>
        <NButton text @click="reveal"><BIconPlus /></NButton>
      </div>
    </template>
    <NTree
      block-line
      :data="roots"
      key-field="id"
      label-field="name"
      @update:selected-keys="(keys) => selectNode(keys[0])"
    />
  </NCollapseItem>
  <NModal to="#app" :show="isRevealed" preset="card" class="w-80" :closable="false">
    <TagEditor :confirm="confirm" :cancel="cancel" />
  </NModal>
</template>
