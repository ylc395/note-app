<script lang="ts">
import { computed, defineComponent } from 'vue';
import { BIconFilePdf, BIconFileImage, BIconFilePlay, BIconFileEarmark } from 'bootstrap-icons-vue';

export default defineComponent({
  components: {
    IconPdf: BIconFilePdf,
    IconImage: BIconFileImage,
    IconVideo: BIconFilePlay,
    IconUnknown: BIconFileEarmark,
  },
  props: {
    mimeType: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const icon = computed(() => {
      if (props.mimeType.endsWith('/pdf')) {
        return 'IconPdf';
      }

      if (props.mimeType.startsWith('image/')) {
        return 'IconImage';
      }

      if (props.mimeType.startsWith('video/')) {
        return 'IconVideo';
      }

      return 'IconUnknown';
    });

    return { icon };
  },
});
</script>
<template>
  <component :is="icon" />
</template>
