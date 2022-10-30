<script lang="ts">
import { defineComponent } from 'vue';
import SearchInput from './SearchInput.vue';
import ListMain from './Main/index.vue';

export default defineComponent({
  components: { SearchInput, ListMain },
});
</script>
<template>
  <div class="p-2 bg-white border-r">
    <SearchInput />
    <ListMain />
  </div>
</template>
