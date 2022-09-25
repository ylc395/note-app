<script lang="ts">
import { defineComponent } from 'vue';
import { Editor, rootCtx } from '@milkdown/core';
import { VueEditor, useEditor } from '@milkdown/vue';
import { gfm } from '@milkdown/preset-gfm';

export default defineComponent({
  components: { VueEditor },
  setup() {
    const { editor } = useEditor((root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
        })
        .use(gfm),
    );

    return { editor };
  },
});
</script>
<template>
  <VueEditor :editor="editor" />
</template>
