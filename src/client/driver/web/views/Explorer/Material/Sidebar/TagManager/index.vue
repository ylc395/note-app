<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useMouseInElement } from '@vueuse/core';
import { container } from 'tsyringe';
import { NTree, NCollapseItem, NButton } from 'naive-ui';
import { BIconPlus } from 'bootstrap-icons-vue';

import MaterialService from 'service/MaterialService';
import TagForm from './TagForm.vue';
import Contextmenu from './Contextmenu.vue';
import useContextmenu from 'web/components/useContextmenu';

export default defineComponent({
  name: 'TagManager',
  components: { NTree, NCollapseItem, NButton, BIconPlus, TagForm, Contextmenu },
  setup() {
    const {
      tagTree: { roots, selectTag, selectedTagId, load: loadTagTree, startCreatingTag },
    } = container.resolve(MaterialService);

    const { token: contextmenuToken, reveal } = useContextmenu();
    const rootRef = ref();
    const { isOutside } = useMouseInElement(rootRef);

    onMounted(loadTagTree);

    return { roots, selectTag, isOutside, rootRef, contextmenuToken, reveal, selectedTagId, startCreatingTag };
  },
});
</script>
<template>
  <NCollapseItem ref="rootRef" title="标签管理器">
    <template #header-extra="{ collapsed }">
      <div v-if="!collapsed && !isOutside" @click.stop>
        <NButton text @click="startCreatingTag"><BIconPlus /></NButton>
      </div>
    </template>
    <div class="w-full overflow-x-auto">
      <NTree
        block-line
        :data="roots"
        key-field="id"
        label-field="name"
        :node-props="
          ({ option }) => ({
            onContextmenu: (e) => {
              selectTag(option.id as number);
              reveal();
            },
          })
        "
        :selected-keys="typeof selectedTagId === 'number' ? [selectedTagId] : []"
        @update:selected-keys="(keys) => selectTag(keys[0])"
      />
      <TagForm />
      <Contextmenu :token="contextmenuToken" />
    </div>
  </NCollapseItem>
</template>
