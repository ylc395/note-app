<script lang="ts">
import { defineComponent, inject, ref, type PropType } from 'vue';
import { NDropdown, type DropdownOption } from 'naive-ui';
import { useMouse } from '@vueuse/core';
import type useContextmenu from './useContextmenu';

export default defineComponent({
  components: { NDropdown },
  props: {
    token: { required: true, type: Symbol as PropType<ReturnType<typeof useContextmenu>['token']> },
    options: { required: true, type: Array as PropType<DropdownOption[]> },
  },
  emits: ['select'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { isRevealed, cancel, confirm, onReveal } = inject(props.token)!;
    const x = ref<number>();
    const y = ref<number>();
    const { x: mouseX, y: mouseY } = useMouse();

    onReveal(() => {
      x.value = mouseX.value;
      y.value = mouseY.value;
    });

    const handleSelect = (key: string | number, option: DropdownOption) => {
      emit('select', key, option);
      confirm();
    };

    return { isRevealed, handleSelect, cancel, x, y };
  },
});
</script>
<template>
  <NDropdown
    trigger="manual"
    :show="isRevealed"
    placement="bottom-start"
    :x="x"
    :y="y"
    :options="options"
    @clickoutside="cancel"
    @select="handleSelect"
  >
    <div />
  </NDropdown>
</template>
