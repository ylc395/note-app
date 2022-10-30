<script lang="ts">
import { defineComponent } from 'vue';

import Manager from './Sidebar/index.vue';
import List from './List/index.vue';

export default defineComponent({
  components: { Manager, List },
});
</script>
<template>
  <div class="bg-gray-100 h-full flex">
    <Manager />
    <List class="flex-grow" />
  </div>
</template>
