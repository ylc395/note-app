<script lang="ts">
import { defineComponent } from 'vue';
import { NButton, NInput, NPopover } from 'naive-ui';
import { BIconFilter, BIconSearch } from 'bootstrap-icons-vue';

export default defineComponent({
  components: { NButton, NInput, NPopover, BIconFilter, BIconSearch },
});
</script>
<template>
  <div class="flex">
    <NInput class="search-input" placeholder="">
      <template #prefix>
        <BIconSearch />
      </template>
      <template #suffix>
        <NPopover placement="bottom-end" trigger="click">
          <template #trigger>
            <NButton text class="text-lg mx-2"><BIconFilter /></NButton>
          </template>
          <div>日历，label，tags,types...</div>
        </NPopover>
      </template>
    </NInput>
  </div>
</template>
<style scoped>
:deep(.search-input .n-input-wrapper) {
  padding-right: 0;
}
</style>
