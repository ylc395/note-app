<script lang="ts">
import { defineComponent } from 'vue';
import SearchInput from './SearchInput.vue';

export default defineComponent({
  components: { SearchInput },
});
</script>
<template>
  <div class="p-2 bg-white border-r">
    <SearchInput />
    <div>列表</div>
  </div>
</template>
