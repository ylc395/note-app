<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue';
import { useConfirmDialog } from '@vueuse/core';
import { container } from 'tsyringe';

import Contextmenu from 'web/components/Contextmenu.vue';
import type useContextmenu from 'web/components/useContextmenu';

import DeleteConfirm from './DeleteConfirm.vue';
import MaterialService from 'service/MaterialService';

export default defineComponent({
  components: { Contextmenu, DeleteConfirm },
  props: {
    token: { required: true, type: Symbol as PropType<ReturnType<typeof useContextmenu>['token']> },
  },
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { onConfirm } = inject(props.token)!;
    const {
      tagTree: { startCreatingTag },
    } = container.resolve(MaterialService);
    const deleteDialog = useConfirmDialog();

    onConfirm((key: string) => {
      switch (key) {
        case 'create':
          return startCreatingTag();
        case 'delete':
          return deleteDialog.reveal();
        default:
          break;
      }
    });

    return { deleteDialog };
  },
});
</script>
<template>
  <Contextmenu
    :token="token"
    :options="[
      { label: '新建子标签', key: 'create' },
      { label: '删除', key: 'delete' },
      { label: '重命名', key: 'rename' },
    ]"
  />
  <DeleteConfirm :dialog="deleteDialog" />
</template>
